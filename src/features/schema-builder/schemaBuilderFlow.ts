import { MarkerType, type Edge, type Node } from '@xyflow/react'
import type { SchemaBuilderDraft, SchemaRelationshipDraft } from './schemaBuilderTypes'

export type SelectedElement =
  | { kind: 'node'; id: string }
  | { kind: 'relationship'; id: string }
  | null

export type SchemaFlowNode = Node<{
  label: string
  key: string[]
  propertyCount: number
  isRelationshipEndpoint: boolean
}, 'schemaNode'>

export type RelationshipLabelOffset = {
  x: number
  y: number
}

export type RelationshipRoute = {
  sourceNodeId: string
  targetNodeId: string
  sourceHandle: string
  targetHandle: string
  centerXOffset: number
  centerYOffset: number
  nodeBounds: SchemaNodeBounds[]
  isSelfRelationship?: boolean
}

export type RelationshipRouteOverride = {
  sourceNodeId: string
  targetNodeId: string
  sourceHandle?: string | null
  targetHandle?: string | null
}

export type SchemaNodeBounds = {
  id: string
  x: number
  y: number
  width: number
  height: number
}

type RoutePoint = {
  x: number
  y: number
}

type HandleSide = 'left' | 'right' | 'top' | 'bottom'

type CubicSegment = {
  start: RoutePoint
  control1: RoutePoint
  control2: RoutePoint
  end: RoutePoint
}

type RelationshipHandleCandidate = {
  id: string
  side: HandleSide
  percent: number
  point: RoutePoint
}

export type SchemaFlowEdge = Edge<{
  relationshipId: string
  label: string
  labelOffset: RelationshipLabelOffset
  route: RelationshipRoute
  isSelected: boolean
  onSelectRelationship?: (relationshipId: string) => void
}, 'schemaRelationship'>

export const schemaRelationshipHandlePercents = [20, 50, 80] as const

export const relationshipLabelOffsetPattern: RelationshipLabelOffset[] = [
  { x: 0, y: 0 },
  { x: 0, y: -72 },
  { x: 0, y: 72 },
  { x: 124, y: -72 },
  { x: -124, y: 72 },
  { x: 124, y: 72 },
  { x: -124, y: -72 },
  { x: 0, y: -140 },
  { x: 0, y: 140 },
  { x: 180, y: 0 },
  { x: -180, y: 0 },
]

const relationshipRouteOffsetPattern = [0, -28, 28, -44, 44, -60, 60]
const schemaNodeWidth = 230
const schemaNodeMinHeight = 126
const schemaNodeLineHeight = 22
const schemaNodeKeyCharsPerLine = 30
const selfRelationshipLoopPadding = 86
const relationshipLabelHeight = 28
const relationshipLabelPadding = 8
const relationshipLabelLeaderThreshold = 20
const relationshipLabelEndpointClearance = 150
const relationshipRouteBendPenalty = 42
const relationshipRouteSidePenalty = 180
const relationshipCurveMinControlDistance = 44
const relationshipCurveMaxControlDistance = 180
const relationshipCurveMaxParallelBow = 64

export function getSelectedRelationshipContext(draft: SchemaBuilderDraft, selectedElement: SelectedElement) {
  if (selectedElement?.kind !== 'relationship') {
    return { relationshipId: null, endpointNodeIds: [] as string[] }
  }

  const relationship = draft.relationships.find((item) => item.id === selectedElement.id)
  if (!relationship) {
    return { relationshipId: null, endpointNodeIds: [] as string[] }
  }

  return {
    relationshipId: relationship.id,
    endpointNodeIds: [relationship.fromNodeId, relationship.toNodeId].filter(Boolean),
  }
}

export function buildSchemaFlowNodes(draft: SchemaBuilderDraft, selectedElement: SelectedElement): SchemaFlowNode[] {
  const selectedRelationshipContext = getSelectedRelationshipContext(draft, selectedElement)
  const endpointNodeIds = new Set(selectedRelationshipContext.endpointNodeIds)

  return draft.nodes.map((node) => ({
    id: node.id,
    type: 'schemaNode',
    position: node.position,
    data: {
      label: node.label || 'Unnamed node',
      key: node.key,
      propertyCount: node.properties.length,
      isRelationshipEndpoint: endpointNodeIds.has(node.id),
    },
    selected: selectedElement?.kind === 'node' && selectedElement.id === node.id,
    zIndex: endpointNodeIds.has(node.id) || selectedElement?.kind === 'node' && selectedElement.id === node.id ? 30 : 20,
  }))
}

export function buildSchemaFlowEdges(
  draft: SchemaBuilderDraft,
  selectedElement: SelectedElement,
  routeOverrides: Record<string, RelationshipRouteOverride> = {},
): SchemaFlowEdge[] {
  const routes = calculateRelationshipRoutes(draft, routeOverrides)
  const labelOffsets = calculateRelationshipLabelOffsets(draft)

  return draft.relationships
    .filter((relationship) => relationship.fromNodeId && relationship.toNodeId)
    .map((relationship) => {
      const label = relationship.type || 'RELATIONSHIP'
      const isSelected = selectedElement?.kind === 'relationship' && selectedElement.id === relationship.id

      return {
        id: relationship.id,
        source: relationship.fromNodeId,
        target: relationship.toNodeId,
        sourceHandle: routes.get(relationship.id)?.sourceHandle,
        targetHandle: routes.get(relationship.id)?.targetHandle,
        label,
        ariaLabel: label,
        type: 'schemaRelationship',
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: isSelected ? 'var(--flow-edge-selected)' : 'var(--flow-edge)',
        },
        selected: isSelected,
        zIndex: isSelected ? 4 : 1,
        data: {
          relationshipId: relationship.id,
          label,
          labelOffset: labelOffsets.get(relationship.id) ?? relationshipLabelOffsetPattern[0],
          route: routes.get(relationship.id) ?? {
            sourceNodeId: relationship.fromNodeId,
            targetNodeId: relationship.toNodeId,
            sourceHandle: 'source-right',
            targetHandle: 'target-left',
            centerXOffset: 0,
            centerYOffset: 0,
            nodeBounds: estimateSchemaNodeBounds(draft),
          },
          isSelected,
        },
      }
    })
}

function calculateRelationshipRoutes(
  draft: SchemaBuilderDraft,
  routeOverrides: Record<string, RelationshipRouteOverride>,
) {
  const nodeBounds = estimateSchemaNodeBounds(draft)
  const nodeBoundsById = new Map(nodeBounds.map((bounds) => [bounds.id, bounds]))
  const routeGroups = new Map<string, SchemaRelationshipDraft[]>()
  const routes = new Map<string, RelationshipRoute>()

  draft.relationships
    .filter((relationship) => relationship.fromNodeId && relationship.toNodeId)
    .forEach((relationship) => {
      const sourceBounds = nodeBoundsById.get(relationship.fromNodeId)
      const targetBounds = nodeBoundsById.get(relationship.toNodeId)
      if (!sourceBounds || !targetBounds) return

      if (relationship.fromNodeId === relationship.toNodeId) {
        routes.set(relationship.id, {
          sourceNodeId: relationship.fromNodeId,
          targetNodeId: relationship.toNodeId,
          sourceHandle: relationshipHandleId('source', 'top', 20),
          targetHandle: relationshipHandleId('target', 'right', 20),
          centerXOffset: 0,
          centerYOffset: 0,
          nodeBounds,
          isSelfRelationship: true,
        })
        return
      }

      const automaticRoute = chooseRelationshipRoute(sourceBounds, targetBounds, nodeBounds)
      const routeOverride = routeOverrides[relationship.id]
      const bestRoute = routeOverride?.sourceNodeId === relationship.fromNodeId && routeOverride.targetNodeId === relationship.toNodeId
        ? {
            sourceHandle: routeOverride.sourceHandle ?? automaticRoute.sourceHandle,
            targetHandle: routeOverride.targetHandle ?? automaticRoute.targetHandle,
          }
        : automaticRoute
      const sourceHandle = bestRoute.sourceHandle
      const targetHandle = bestRoute.targetHandle
      const routeAxis = handleRouteAxis(sourceHandle)
      const groupKey = `${routeAxis}:${relationship.fromNodeId}:${sourceHandle}:${relationship.toNodeId}:${targetHandle}`
      const sourceGroupKey = `${routeAxis}:source:${relationship.fromNodeId}:${sourceHandle}`
      const targetGroupKey = `${routeAxis}:target:${relationship.toNodeId}:${targetHandle}`

      const keys = [groupKey, sourceGroupKey, targetGroupKey]
      keys.forEach((key) => {
        const group = routeGroups.get(key) ?? []
        group.push(relationship)
        routeGroups.set(key, group)
      })

      routes.set(relationship.id, {
        sourceNodeId: relationship.fromNodeId,
        targetNodeId: relationship.toNodeId,
        sourceHandle,
        targetHandle,
        centerXOffset: 0,
        centerYOffset: 0,
        nodeBounds,
      })
    })

  routeGroups.forEach((relationships, key) => {
    if (relationships.length < 2) return
    const routeAxis = key.startsWith('y:') ? 'y' : 'x'
    relationships.forEach((relationship, index) => {
      const route = routes.get(relationship.id)
      if (!route) return
      const offset = relationshipRouteOffsetPattern[index % relationshipRouteOffsetPattern.length]
      routes.set(relationship.id, {
        ...route,
        centerXOffset: routeAxis === 'x' ? route.centerXOffset + offset : route.centerXOffset,
        centerYOffset: routeAxis === 'y' ? route.centerYOffset + offset : route.centerYOffset,
      })
    })
  })

  return routes
}

function chooseRelationshipRoute(
  sourceBounds: SchemaNodeBounds,
  targetBounds: SchemaNodeBounds,
  nodeBounds: SchemaNodeBounds[],
) {
  const sourceCandidates = relationshipHandleCandidates(sourceBounds, 'source')
  const targetCandidates = relationshipHandleCandidates(targetBounds, 'target')
  const sourceCenter = boundsCenter(sourceBounds)
  const targetCenter = boundsCenter(targetBounds)

  let bestRoute:
    | {
      sourceHandle: string
      targetHandle: string
      score: number
    }
    | null = null

  sourceCandidates.forEach((sourceCandidate) => {
    targetCandidates.forEach((targetCandidate) => {
      const route: RelationshipRoute = {
        sourceNodeId: sourceBounds.id,
        targetNodeId: targetBounds.id,
        sourceHandle: sourceCandidate.id,
        targetHandle: targetCandidate.id,
        centerXOffset: 0,
        centerYOffset: 0,
        nodeBounds,
      }
      const points = buildRelationshipCurve(sourceCandidate.point, targetCandidate.point, route).labelPoints
      const score = relationshipRouteScore({
        sourceCandidate,
        targetCandidate,
        sourceCenter,
        targetCenter,
        points,
      })
      if (!bestRoute || score < bestRoute.score) {
        bestRoute = {
          sourceHandle: sourceCandidate.id,
          targetHandle: targetCandidate.id,
          score,
        }
      }
    })
  })

  return bestRoute ?? {
    sourceHandle: relationshipHandleId('source', 'right', 50),
    targetHandle: relationshipHandleId('target', 'left', 50),
  }
}

function relationshipRouteScore({
  sourceCandidate,
  targetCandidate,
  sourceCenter,
  targetCenter,
  points,
}: {
  sourceCandidate: RelationshipHandleCandidate
  targetCandidate: RelationshipHandleCandidate
  sourceCenter: RoutePoint
  targetCenter: RoutePoint
  points: RoutePoint[]
}) {
  const routeLength = points.length > 1 ? routePointsLength(points) : routePointsLength([sourceCandidate.point, targetCandidate.point]) + 1000
  const bendCount = Math.max(0, points.length - 2)
  const sourceDirectionPenalty = sideDirectionPenalty(sourceCandidate.side, sourceCenter, targetCenter)
  const targetDirectionPenalty = sideDirectionPenalty(targetCandidate.side, targetCenter, sourceCenter)
  const sourceCenterPenalty = Math.abs(sourceCandidate.percent - 50) * 0.25
  const targetCenterPenalty = Math.abs(targetCandidate.percent - 50) * 0.25

  return (
    routeLength +
    bendCount * relationshipRouteBendPenalty +
    (sourceDirectionPenalty + targetDirectionPenalty) * relationshipRouteSidePenalty +
    sourceCenterPenalty +
    targetCenterPenalty
  )
}

function relationshipHandleCandidates(bounds: SchemaNodeBounds, type: 'source' | 'target') {
  const sides: HandleSide[] = ['left', 'right', 'top', 'bottom']
  return sides.flatMap((side) =>
    schemaRelationshipHandlePercents.map((percent) => ({
      id: relationshipHandleId(type, side, percent),
      side,
      percent,
      point: relationshipHandlePoint(bounds, side, percent),
    })),
  )
}

function relationshipHandleId(type: 'source' | 'target', side: HandleSide, percent: number) {
  return `${type}-${side}-${percent}`
}

function relationshipHandlePoint(bounds: SchemaNodeBounds, side: HandleSide, percent: number) {
  const ratio = percent / 100
  if (side === 'left') {
    return { x: bounds.x, y: bounds.y + bounds.height * ratio }
  }
  if (side === 'right') {
    return { x: bounds.x + bounds.width, y: bounds.y + bounds.height * ratio }
  }
  if (side === 'top') {
    return { x: bounds.x + bounds.width * ratio, y: bounds.y }
  }
  return { x: bounds.x + bounds.width * ratio, y: bounds.y + bounds.height }
}

function boundsCenter(bounds: SchemaNodeBounds) {
  return {
    x: bounds.x + bounds.width / 2,
    y: bounds.y + bounds.height / 2,
  }
}

function sideDirectionPenalty(side: HandleSide, from: RoutePoint, to: RoutePoint) {
  const vector = sideVector(side)
  const delta = {
    x: to.x - from.x,
    y: to.y - from.y,
  }
  const length = Math.max(1, Math.hypot(delta.x, delta.y))
  const dot = (vector.x * delta.x + vector.y * delta.y) / length
  return Math.max(0, 1 - dot)
}

function sideVector(side: HandleSide) {
  if (side === 'left') return { x: -1, y: 0 }
  if (side === 'right') return { x: 1, y: 0 }
  if (side === 'top') return { x: 0, y: -1 }
  return { x: 0, y: 1 }
}

function handleRouteAxis(handleId: string) {
  return handleId.includes('-top-') || handleId.includes('-bottom-') ? 'y' : 'x'
}

function routePointsLength(points: RoutePoint[]) {
  return points.slice(1).reduce((sum, point, index) => {
    const previous = points[index]
    return sum + Math.hypot(point.x - previous.x, point.y - previous.y)
  }, 0)
}

export function routeRelationshipPath({
  sourceX,
  sourceY,
  targetX,
  targetY,
  route,
  label,
  labelOffset,
}: {
  sourceX: number
  sourceY: number
  targetX: number
  targetY: number
  route?: RelationshipRoute
  label?: string
  labelOffset?: RelationshipLabelOffset
}) {
  const source = roundRoutePoint({ x: sourceX, y: sourceY })
  const target = roundRoutePoint({ x: targetX, y: targetY })
  const curve = buildRelationshipCurve(source, target, route)
  const labelPoint = routeLabelPoint(curve.labelPoints, route, label, labelOffset)
  const labelCenter = {
    x: labelPoint.x + (labelOffset?.x ?? 0),
    y: labelPoint.y + (labelOffset?.y ?? 0),
  }
  const labelLeaderLength = Math.abs(labelCenter.x - labelPoint.anchorX) + Math.abs(labelCenter.y - labelPoint.anchorY)
  return {
    path: curve.path,
    labelX: labelPoint.x,
    labelY: labelPoint.y,
    labelAnchorX: labelPoint.anchorX,
    labelAnchorY: labelPoint.anchorY,
    labelLeaderPath: labelLeaderLength > relationshipLabelLeaderThreshold
      ? compactPointsToPath([{ x: labelPoint.anchorX, y: labelPoint.anchorY }, labelCenter])
      : '',
  }
}

function buildRelationshipCurve(source: RoutePoint, target: RoutePoint, route?: RelationshipRoute) {
  if (route?.isSelfRelationship) {
    return buildSelfRelationshipCurve(source, target, route)
  }

  const sourceSide = handleSideFromId(route?.sourceHandle) ?? inferredSide(source, target)
  const targetSide = handleSideFromId(route?.targetHandle) ?? inferredSide(target, source)
  const sourceVector = sideVector(sourceSide)
  const targetVector = sideVector(targetSide)
  const dx = target.x - source.x
  const dy = target.y - source.y
  const distance = Math.max(1, Math.hypot(dx, dy))
  const normal = segmentNormal(source, target)
  const parallelBow = clamp(
    dominantRouteOffset(route) * 0.75,
    -relationshipCurveMaxParallelBow,
    relationshipCurveMaxParallelBow,
  )
  const endpointControlDistance = clamp(distance * 0.28, relationshipCurveMinControlDistance, relationshipCurveMaxControlDistance)
  const segment: CubicSegment = {
    start: source,
    control1: roundRoutePoint({
      x: source.x + sourceVector.x * endpointControlDistance + normal.x * parallelBow,
      y: source.y + sourceVector.y * endpointControlDistance + normal.y * parallelBow,
    }),
    control2: roundRoutePoint({
      x: target.x + targetVector.x * endpointControlDistance + normal.x * parallelBow,
      y: target.y + targetVector.y * endpointControlDistance + normal.y * parallelBow,
    }),
    end: target,
  }

  return {
    path: cubicSegmentsToPath([segment]),
    labelPoints: sampleCubicSegments([segment], 24),
  }
}

function buildSelfRelationshipCurve(source: RoutePoint, target: RoutePoint, route: RelationshipRoute) {
  const node = route.nodeBounds.find((bounds) => bounds.id === route.sourceNodeId)
  if (!node) {
    const first: CubicSegment = {
      start: source,
      control1: { x: source.x, y: source.y - selfRelationshipLoopPadding },
      control2: { x: target.x + selfRelationshipLoopPadding, y: target.y - selfRelationshipLoopPadding },
      end: target,
    }
    return {
      path: cubicSegmentsToPath([first]),
      labelPoints: sampleCubicSegments([first], 24),
    }
  }

  const loopTop = node.y - selfRelationshipLoopPadding
  const loopRight = node.x + node.width + selfRelationshipLoopPadding
  const first: CubicSegment = {
    start: source,
    control1: { x: source.x, y: loopTop },
    control2: { x: loopRight, y: loopTop },
    end: { x: loopRight, y: (loopTop + target.y) / 2 },
  }
  const second: CubicSegment = {
    start: first.end,
    control1: { x: loopRight, y: target.y },
    control2: { x: target.x + selfRelationshipLoopPadding, y: target.y },
    end: target,
  }
  return {
    path: cubicSegmentsToPath([first, second]),
    labelPoints: sampleCubicSegments([first, second], 24),
  }
}

function handleSideFromId(handleId?: string) {
  if (!handleId) return null
  const side = handleId.split('-')[1]
  return side === 'left' || side === 'right' || side === 'top' || side === 'bottom' ? side : null
}

function inferredSide(from: RoutePoint, to: RoutePoint): HandleSide {
  const dx = to.x - from.x
  const dy = to.y - from.y
  if (Math.abs(dx) >= Math.abs(dy)) return dx >= 0 ? 'right' : 'left'
  return dy >= 0 ? 'bottom' : 'top'
}

function dominantRouteOffset(route?: RelationshipRoute) {
  const xOffset = route?.centerXOffset ?? 0
  const yOffset = route?.centerYOffset ?? 0
  return Math.abs(xOffset) >= Math.abs(yOffset) ? xOffset : yOffset
}

function cubicSegmentsToPath(segments: CubicSegment[]) {
  if (segments.length === 0) return ''
  const commands = [`M ${segments[0].start.x} ${segments[0].start.y}`]
  segments.forEach((segment) => {
    commands.push([
      'C',
      segment.control1.x,
      segment.control1.y,
      segment.control2.x,
      segment.control2.y,
      segment.end.x,
      segment.end.y,
    ].join(' '))
  })
  return commands.join(' ')
}

function sampleCubicSegments(segments: CubicSegment[], samplesPerSegment: number) {
  const points: RoutePoint[] = []
  segments.forEach((segment, segmentIndex) => {
    const startSample = segmentIndex === 0 ? 0 : 1
    for (let index = startSample; index <= samplesPerSegment; index += 1) {
      points.push(sampleCubicSegment(segment, index / samplesPerSegment))
    }
  })
  return points
}

function sampleCubicSegment(segment: CubicSegment, t: number) {
  const inverse = 1 - t
  return roundRoutePoint({
    x:
      inverse ** 3 * segment.start.x +
      3 * inverse ** 2 * t * segment.control1.x +
      3 * inverse * t ** 2 * segment.control2.x +
      t ** 3 * segment.end.x,
    y:
      inverse ** 3 * segment.start.y +
      3 * inverse ** 2 * t * segment.control1.y +
      3 * inverse * t ** 2 * segment.control2.y +
      t ** 3 * segment.end.y,
  })
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

function estimateSchemaNodeBounds(draft: SchemaBuilderDraft): SchemaNodeBounds[] {
  return draft.nodes.map((node) => {
    const keyText = node.key.length > 0 ? `Key: ${node.key.join(', ')}` : 'No key set'
    const keyLines = Math.max(1, Math.ceil(keyText.length / schemaNodeKeyCharsPerLine))
    const height = Math.max(schemaNodeMinHeight, 78 + keyLines * schemaNodeLineHeight)
    return {
      id: node.id,
      x: node.position.x,
      y: node.position.y,
      width: schemaNodeWidth,
      height,
    }
  })
}

function compactPointsToPath(points: RoutePoint[]) {
  if (points.length === 0) return ''
  return points.map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`).join(' ')
}

function routeLabelPoint(
  points: RoutePoint[],
  route?: RelationshipRoute,
  label = '',
  labelOffset: RelationshipLabelOffset = { x: 0, y: 0 },
) {
  if (points.length === 0) return { x: 0, y: 0, anchorX: 0, anchorY: 0 }
  if (points.length === 1) return { ...points[0], anchorX: points[0].x, anchorY: points[0].y }

  const segments = points.slice(1).map((point, index) => ({
    start: points[index],
    end: point,
    length: Math.hypot(point.x - points[index].x, point.y - points[index].y),
  }))
  const labelWidth = Math.max(78, label.length * 8 + 26)
  const nodeObstacles = (route?.nodeBounds ?? []).map((bounds) => ({
    x: bounds.x - relationshipLabelPadding,
    y: bounds.y - relationshipLabelPadding,
    width: bounds.width + relationshipLabelPadding * 2,
    height: bounds.height + relationshipLabelPadding * 2,
  }))
  const candidates = segments
    .filter((segment) => segment.length > 24)
    .flatMap((segment, segmentIndex) => {
      const center = {
        x: segment.start.x + (segment.end.x - segment.start.x) / 2,
        y: segment.start.y + (segment.end.y - segment.start.y) / 2,
      }
      const normal = segmentNormal(segment.start, segment.end)
      const shifts = [0, -38, 38, -72, 72, -108, 108].map((amount) => ({
        x: normal.x * amount,
        y: normal.y * amount,
      }))

      return shifts.map((shift, shiftIndex) => {
        const actualCenter = {
          x: center.x + shift.x + labelOffset.x,
          y: center.y + shift.y + labelOffset.y,
        }
        const rect = {
          x: actualCenter.x - labelWidth / 2,
          y: actualCenter.y - relationshipLabelHeight / 2,
          width: labelWidth,
          height: relationshipLabelHeight,
        }
        const overlap = nodeObstacles.reduce((sum, obstacle) => sum + rectOverlapArea(rect, obstacle), 0)
        const endpointDistance = Math.min(
          Math.hypot(actualCenter.x - points[0].x, actualCenter.y - points[0].y),
          Math.hypot(actualCenter.x - points[points.length - 1].x, actualCenter.y - points[points.length - 1].y),
        )
        const displacement = Math.hypot(actualCenter.x - center.x, actualCenter.y - center.y)
        const endpointPenalty = endpointDistance < relationshipLabelEndpointClearance
          ? (relationshipLabelEndpointClearance - endpointDistance) * 8
          : 0
        return {
          point: { x: actualCenter.x - labelOffset.x, y: actualCenter.y - labelOffset.y },
          anchor: center,
          score: overlap * 3000 + endpointPenalty + displacement * 0.5 - segment.length * 0.45 + shiftIndex * 6 - endpointDistance * 0.01 + segmentIndex,
        }
      })
    })

  if (candidates.length > 0) {
    const best = candidates.sort((a, b) => a.score - b.score)[0]
    return {
      ...best.point,
      anchorX: best.anchor.x,
      anchorY: best.anchor.y,
    }
  }

  const totalLength = segments.reduce((sum, segment) => sum + segment.length, 0)
  let remaining = totalLength / 2
  for (const segment of segments) {
    if (remaining <= segment.length) {
      const ratio = segment.length === 0 ? 0 : remaining / segment.length
      return {
        x: segment.start.x + (segment.end.x - segment.start.x) * ratio,
        y: segment.start.y + (segment.end.y - segment.start.y) * ratio,
        anchorX: segment.start.x + (segment.end.x - segment.start.x) * ratio,
        anchorY: segment.start.y + (segment.end.y - segment.start.y) * ratio,
      }
    }
    remaining -= segment.length
  }
  const midpoint = points[Math.floor(points.length / 2)]
  return { ...midpoint, anchorX: midpoint.x, anchorY: midpoint.y }
}

function segmentNormal(start: RoutePoint, end: RoutePoint) {
  const dx = end.x - start.x
  const dy = end.y - start.y
  const length = Math.max(1, Math.hypot(dx, dy))
  return {
    x: -dy / length,
    y: dx / length,
  }
}

function rectOverlapArea(
  a: { x: number; y: number; width: number; height: number },
  b: { x: number; y: number; width: number; height: number },
) {
  const width = Math.max(0, Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x))
  const height = Math.max(0, Math.min(a.y + a.height, b.y + b.height) - Math.max(a.y, b.y))
  return width * height
}

function roundRoutePoint(point: RoutePoint) {
  return {
    x: roundRouteValue(point.x),
    y: roundRouteValue(point.y),
  }
}

function roundRouteValue(value: number) {
  return Math.round(value * 100) / 100
}

function calculateRelationshipLabelOffsets(draft: SchemaBuilderDraft) {
  const nodesById = new Map(draft.nodes.map((node) => [node.id, node]))
  const buckets = new Map<string, SchemaRelationshipDraft[]>()

  draft.relationships
    .filter((relationship) => relationship.fromNodeId && relationship.toNodeId)
    .forEach((relationship) => {
      const sourceNode = nodesById.get(relationship.fromNodeId)
      const targetNode = nodesById.get(relationship.toNodeId)
      const midpointX = sourceNode && targetNode ? (sourceNode.position.x + targetNode.position.x) / 2 : 0
      const midpointY = sourceNode && targetNode ? (sourceNode.position.y + targetNode.position.y) / 2 : 0
      const bucketKey = `${Math.round(midpointX / 220)}:${Math.round(midpointY / 140)}`
      const bucket = buckets.get(bucketKey) ?? []
      bucket.push(relationship)
      buckets.set(bucketKey, bucket)
    })

  const offsets = new Map<string, RelationshipLabelOffset>()
  const relationshipsBySource = new Map<string, SchemaRelationshipDraft[]>()
  draft.relationships
    .filter((relationship) => relationship.fromNodeId && relationship.toNodeId)
    .forEach((relationship) => {
      const sourceRelationships = relationshipsBySource.get(relationship.fromNodeId) ?? []
      sourceRelationships.push(relationship)
      relationshipsBySource.set(relationship.fromNodeId, sourceRelationships)
    })

  relationshipsBySource.forEach((relationships) => {
    if (relationships.length < 2) return
    relationships.forEach((relationship, index) => {
      offsets.set(relationship.id, relationshipLabelOffsetPattern[index % relationshipLabelOffsetPattern.length])
    })
  })

  buckets.forEach((relationships) => {
    relationships.forEach((relationship, index) => {
      if (!offsets.has(relationship.id)) {
        offsets.set(relationship.id, relationshipLabelOffsetPattern[index % relationshipLabelOffsetPattern.length])
      }
    })
  })

  return offsets
}
