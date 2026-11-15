// SI-assisted (Claude), NASA Space Apps 2026
// Paragraphs of plain text; web addresses in the text become links.
const URL = /(https?:\/\/[^\s)]+[^\s).,;])/g

export function Linked({ text }: { text: string }) {
  const parts = text.split(URL)
  return (
    <>
      {parts.map((p, i) =>
        i % 2 === 1 ? (
          <a key={i} href={p} target="_blank" rel="noreferrer" style={{ overflowWrap: 'anywhere' }}>{p.replace(/^https?:\/\//, '')}</a>
        ) : (
          p
        ),
      )}
    </>
  )
}

export function Prose({ text, className = 'prose' }: { text: string[]; className?: string }) {
  return (
    <div className={className}>
      {text.map((t, i) => <p key={i}><Linked text={t} /></p>)}
    </div>
  )
}
