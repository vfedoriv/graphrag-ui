import { useEffect, useState } from 'react'
import {
  useGenerateSchemaExampleFromFileMutation,
  useGenerateSchemaExampleMutation,
  useGenerateSchemaJsonFromFileMutation,
  useGenerateSchemaJsonMutation,
} from '../../api/schemas'
import type { SchemaGenerationWarning } from '../../api/types'
import { Alert } from '../../shared/ui/Alert'
import { Button } from '../../shared/ui/Button'
import { FieldLabel } from '../../shared/ui/FieldLabel'
import { FileSelectButton } from '../../shared/ui/FileSelectButton'
import { Input } from '../../shared/ui/Input'
import { ProgressBanner } from '../../shared/ui/ProgressBanner'
import { SchemaJsonEditor } from '../../shared/ui/SchemaJsonEditor'
import { StructuredPayloadEditor } from '../../shared/ui/StructuredPayloadEditor'
import { Textarea } from '../../shared/ui/Textarea'

export function SchemaExampleGenerationWorkflow({ onPendingChange }: { onPendingChange: (isPending: boolean) => void }) {
  const [sourceMode, setSourceMode] = useState<'text' | 'file'>('text')

  return (
    <div className='stack' data-testid='schema-example-generation-section'>
      <SourceModeSelector value={sourceMode} onChange={setSourceMode} name='schema-example-source-mode' />
      {sourceMode === 'text' ? (
        <div className='flow-card' data-testid='schemas-workflow-generate-schema-example-text'>
          <SchemaGenerateExampleFromText onPendingChange={onPendingChange} />
        </div>
      ) : (
        <div className='flow-card' data-testid='schemas-workflow-generate-schema-example-file'>
          <SchemaGenerateExampleFromFile onPendingChange={onPendingChange} />
        </div>
      )}
    </div>
  )
}

export function SchemaJsonGenerationWorkflow(
  {
    textOutput, fileOutput, onTextOutputReady, onFileOutputReady, onOpenInBuilder, onPendingChange,
  }: {
    textOutput: string
    fileOutput: string
    onTextOutputReady: (json: string) => void
    onFileOutputReady: (json: string) => void
    onOpenInBuilder: (json: string) => void
    onPendingChange: (isPending: boolean) => void
  },
) {
  const [sourceMode, setSourceMode] = useState<'text' | 'file'>('text')

  return (
    <div className='stack' data-testid='schema-json-generation-section'>
      <SourceModeSelector value={sourceMode} onChange={setSourceMode} name='schema-json-source-mode' />
      {sourceMode === 'text' ? (
        <div className='flow-card' data-testid='schemas-workflow-generate-schema-json'>
          <SchemaGenerateJsonFromText
            onJsonReady={onTextOutputReady}
            output={textOutput}
            onOutputReady={onTextOutputReady}
            onOpenInBuilder={onOpenInBuilder}
            onPendingChange={onPendingChange}
          />
        </div>
      ) : (
        <div className='flow-card' data-testid='schemas-workflow-generate-schema-json-file'>
          <SchemaGenerateJsonFromFile
            onJsonReady={onFileOutputReady}
            output={fileOutput}
            onOutputReady={onFileOutputReady}
            onOpenInBuilder={onOpenInBuilder}
            onPendingChange={onPendingChange}
          />
        </div>
      )}
    </div>
  )
}

function SourceModeSelector({
  value,
  onChange,
  name,
}: {
  value: 'text' | 'file'
  onChange: (value: 'text' | 'file') => void
  name: string
}) {
  return (
    <fieldset className='stack'>
      <legend className='field-label'>Source</legend>
      <div className='toolbar'>
        {[
          ['text', 'From text'],
          ['file', 'From file'],
        ].map(([optionValue, label]) => (
          <label key={optionValue} className='check-row'>
            <input
              type='radio'
              name={name}
              value={optionValue}
              checked={value === optionValue}
              onChange={() => onChange(optionValue as 'text' | 'file')}
            />
            {label}
          </label>
        ))}
      </div>
    </fieldset>
  )
}

function SchemaGenerationWarnings({ warnings }: { warnings?: SchemaGenerationWarning[] }) {
  if (!warnings || warnings.length === 0) return null

  return (
    <div className='notice warning'>
      <h4>Schema generation warnings</h4>
      <ul className='stack'>
        {warnings.map((warning, index) => (
          <li key={`${warning.code ?? 'warning'}-${index}`}>
            {warning.code ? <span className='font-semibold'>{warning.code}: </span> : null}
            <span>{warning.message}</span>
            {warning.suggestion ? <span> Suggestion: {warning.suggestion}</span> : null}
          </li>
        ))}
      </ul>
    </div>
  )
}

function SchemaGenerateExampleFromText({ onPendingChange }: { onPendingChange: (isPending: boolean) => void }) {
  const [text, setText] = useState('')
  const [userPrompt, setUserPrompt] = useState('')
  const [example, setExample] = useState('')
  const generateExample = useGenerateSchemaExampleMutation()

  useEffect(() => {
    onPendingChange(generateExample.isPending)
  }, [generateExample.isPending, onPendingChange])

  return (
    <div className='stack'>
      {generateExample.isPending ? <ProgressBanner message='Waiting for schema example generation...' /> : null}
      <FieldLabel htmlFor='generate-example-text-source'>Source text</FieldLabel>
      <Textarea id='generate-example-text-source' rows={5} value={text} onChange={(e) => setText(e.target.value)} placeholder='Source text' />
      <FieldLabel htmlFor='generate-example-text-guidance'>Generation guidance (optional)</FieldLabel>
      <Textarea id='generate-example-text-guidance' rows={3} value={userPrompt} onChange={(e) => setUserPrompt(e.target.value)} placeholder='Optional generation guidance' />
      <Button
        type='button'
        variant='primary'
        isPending={generateExample.isPending}
        pendingText='Generating...'
        onClick={async () => {
          try {
            const res = await generateExample.mutateAsync({ text, userPrompt })
            setExample(res.example)
          } catch {
            // surfaced via generateExample.error
          }
        }}
      >
        Generate schema example
      </Button>
      <FieldLabel htmlFor='generate-example-text-output'>Generated schema example</FieldLabel>
      <Textarea id='generate-example-text-output' rows={5} value={example} onChange={(e) => setExample(e.target.value)} placeholder='Generated example (editable)' />
      {generateExample.error && <Alert title='Generation failed' message={(generateExample.error as Error).message} />}
    </div>
  )
}

function SchemaGenerateExampleFromFile({ onPendingChange }: { onPendingChange: (isPending: boolean) => void }) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [selectedFilename, setSelectedFilename] = useState('')
  const [example, setExample] = useState('')
  const [error, setError] = useState<string | null>(null)
  const generateExampleFromFile = useGenerateSchemaExampleFromFileMutation()

  useEffect(() => {
    onPendingChange(generateExampleFromFile.isPending)
  }, [generateExampleFromFile.isPending, onPendingChange])

  return (
    <div className='stack'>
      {generateExampleFromFile.isPending ? <ProgressBanner message='Waiting for schema example generation...' /> : null}
      <FileSelectButton
        buttonLabel='Select source file'
        testId='schemas-example-file-select'
        onFileSelected={async (file) => {
          setSelectedFile(file)
          setSelectedFilename(file.name)
        }}
      />
      {selectedFilename && <p>Selected file: {selectedFilename}</p>}
      <Button
        type='button'
        variant='primary'
        isPending={generateExampleFromFile.isPending}
        pendingText='Generating...'
        onClick={async () => {
          setError(null)
          if (!selectedFile) {
            setError('Select a source file before generating schema example.')
            return
          }
          try {
            const res = await generateExampleFromFile.mutateAsync({ file: selectedFile })
            setExample(res.example)
          } catch {
            // surfaced via generateExampleFromFile.error
          }
        }}
      >
        Generate schema example from file
      </Button>
      <FieldLabel htmlFor='generate-example-file-output'>Generated schema example</FieldLabel>
      <Textarea id='generate-example-file-output' rows={5} value={example} onChange={(e) => setExample(e.target.value)} placeholder='Generated example (editable)' />
      {(error || generateExampleFromFile.error) && <Alert title='Generation failed' message={error ?? (generateExampleFromFile.error as Error).message} />}
    </div>
  )
}

function SchemaGenerateJsonFromText(
  {
    onJsonReady, output, onOutputReady, onOpenInBuilder, onPendingChange,
  }: {
    onJsonReady: (json: string) => void
    output: string
    onOutputReady: (json: string) => void
    onOpenInBuilder: (json: string) => void
    onPendingChange: (isPending: boolean) => void
  },
) {
  const [name, setName] = useState('generated-schema')
  const [version, setVersion] = useState(1)
  const [text, setText] = useState('')
  const [example, setExample] = useState('')
  const [exampleFormatError, setExampleFormatError] = useState<string | null>(null)
  const [warnings, setWarnings] = useState<SchemaGenerationWarning[]>([])
  const generateJson = useGenerateSchemaJsonMutation()

  useEffect(() => {
    onPendingChange(generateJson.isPending)
  }, [generateJson.isPending, onPendingChange])

  return (
    <div className='stack'>
      {generateJson.isPending ? <ProgressBanner message='Waiting for schema JSON generation...' /> : null}
      <FieldLabel htmlFor='generate-json-text-name'>Schema name</FieldLabel>
      <Input id='generate-json-text-name' value={name} onChange={(e) => setName(e.target.value)} placeholder='Schema name' />
      <FieldLabel htmlFor='generate-json-text-version'>Schema version</FieldLabel>
      <Input id='generate-json-text-version' type='number' value={version} onChange={(e) => setVersion(Number(e.target.value))} placeholder='Version' />
      <FieldLabel htmlFor='generate-json-text-source'>Source text</FieldLabel>
      <Textarea id='generate-json-text-source' rows={5} value={text} onChange={(e) => setText(e.target.value)} placeholder='Source text' />
      <FieldLabel htmlFor='generate-json-text-example'>Schema example JSON</FieldLabel>
      <StructuredPayloadEditor
        id='generate-json-text-example'
        format='json'
        rows={5}
        value={example}
        onChange={setExample}
        error={exampleFormatError}
        onErrorChange={setExampleFormatError}
        placeholder='Schema example JSON'
      />
      <Button
        type='button'
        variant='primary'
        isPending={generateJson.isPending}
        pendingText='Generating...'
        onClick={async () => {
          try {
            const res = await generateJson.mutateAsync({ name, version, text, example })
            onJsonReady(res.content)
            onOutputReady(res.content)
            setWarnings(res.warnings ?? [])
          } catch {
            // surfaced via generateJson.error
          }
        }}
      >
        Generate schema JSON
      </Button>
      <FieldLabel htmlFor='generate-json-text-output'>Generated schema JSON</FieldLabel>
      <SchemaJsonEditor
        id='generate-json-text-output'
        label='Generated schema JSON'
        value={output}
        onChange={onOutputReady}
        placeholder='Generated JSON response'
        disabled={generateJson.isPending}
      />
      {output.trim() ? (
        <Button type='button' onClick={() => onOpenInBuilder(output)} disabled={generateJson.isPending}>
          Open in Builder
        </Button>
      ) : null}
      <SchemaGenerationWarnings warnings={warnings} />
      {generateJson.error && <Alert title='Generation failed' message={(generateJson.error as Error).message} />}
    </div>
  )
}

function SchemaGenerateJsonFromFile(
  {
    onJsonReady, output, onOutputReady, onOpenInBuilder, onPendingChange,
  }: {
    onJsonReady: (json: string) => void
    output: string
    onOutputReady: (json: string) => void
    onOpenInBuilder: (json: string) => void
    onPendingChange: (isPending: boolean) => void
  },
) {
  const [name, setName] = useState('generated-schema')
  const [version, setVersion] = useState(1)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [selectedFilename, setSelectedFilename] = useState('')
  const [example, setExample] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [exampleFormatError, setExampleFormatError] = useState<string | null>(null)
  const [warnings, setWarnings] = useState<SchemaGenerationWarning[]>([])
  const generateJsonFromFile = useGenerateSchemaJsonFromFileMutation()

  useEffect(() => {
    onPendingChange(generateJsonFromFile.isPending)
  }, [generateJsonFromFile.isPending, onPendingChange])

  return (
    <div className='stack'>
      {generateJsonFromFile.isPending ? <ProgressBanner message='Waiting for schema JSON generation...' /> : null}
      <FieldLabel htmlFor='generate-json-file-name'>Schema name</FieldLabel>
      <Input id='generate-json-file-name' value={name} onChange={(e) => setName(e.target.value)} placeholder='Schema name' />
      <FieldLabel htmlFor='generate-json-file-version'>Schema version</FieldLabel>
      <Input id='generate-json-file-version' type='number' value={version} onChange={(e) => setVersion(Number(e.target.value))} placeholder='Version' />
      <FileSelectButton
        buttonLabel='Select source text file'
        testId='schemas-json-file-select'
        onFileSelected={async (file) => {
          setSelectedFile(file)
          setSelectedFilename(file.name)
        }}
      />
      {selectedFilename && <p>Selected file: {selectedFilename}</p>}
      <FieldLabel htmlFor='generate-json-file-example'>Schema example JSON</FieldLabel>
      <StructuredPayloadEditor
        id='generate-json-file-example'
        format='json'
        rows={5}
        value={example}
        onChange={setExample}
        error={exampleFormatError}
        onErrorChange={setExampleFormatError}
        placeholder='Schema example JSON'
      />
      <Button
        type='button'
        variant='primary'
        isPending={generateJsonFromFile.isPending}
        pendingText='Generating...'
        onClick={async () => {
          setError(null)
          if (!selectedFile) {
            setError('Select a source file before generating schema JSON.')
            return
          }
          try {
            const res = await generateJsonFromFile.mutateAsync({ name, version, example, file: selectedFile })
            onJsonReady(res.content)
            onOutputReady(res.content)
            setWarnings(res.warnings ?? [])
          } catch {
            // surfaced via generateJsonFromFile.error
          }
        }}
      >
        Generate schema JSON from file
      </Button>
      <FieldLabel htmlFor='generate-json-file-output'>Generated schema JSON</FieldLabel>
      <SchemaJsonEditor
        id='generate-json-file-output'
        label='Generated schema JSON'
        value={output}
        onChange={onOutputReady}
        placeholder='Generated JSON response'
        disabled={generateJsonFromFile.isPending}
      />
      {output.trim() ? (
        <Button type='button' onClick={() => onOpenInBuilder(output)} disabled={generateJsonFromFile.isPending}>
          Open in Builder
        </Button>
      ) : null}
      <SchemaGenerationWarnings warnings={warnings} />
      {(error || generateJsonFromFile.error) && <Alert title='Generation failed' message={error ?? (generateJsonFromFile.error as Error).message} />}
    </div>
  )
}
