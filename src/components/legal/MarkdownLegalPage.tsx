import fs from 'node:fs'
import path from 'node:path'
import Link from 'next/link'
import type { ReactNode } from 'react'

type Block =
  | { type: 'h1'; text: string }
  | { type: 'h2'; text: string }
  | { type: 'paragraph'; text: string }
  | { type: 'list'; items: string[] }

function parseMarkdown(markdown: string): Block[] {
  const lines = markdown.replace(/\r\n/g, '\n').split('\n')
  const blocks: Block[] = []
  let paragraph: string[] = []
  let listItems: string[] = []

  const flushParagraph = () => {
    if (paragraph.length > 0) {
      blocks.push({ type: 'paragraph', text: paragraph.join(' ') })
      paragraph = []
    }
  }

  const flushList = () => {
    if (listItems.length > 0) {
      blocks.push({ type: 'list', items: listItems })
      listItems = []
    }
  }

  for (const line of lines) {
    const trimmed = line.trim()

    if (!trimmed) {
      flushParagraph()
      flushList()
      continue
    }

    if (trimmed.startsWith('# ')) {
      flushParagraph()
      flushList()
      blocks.push({ type: 'h1', text: trimmed.slice(2).trim() })
      continue
    }

    if (trimmed.startsWith('## ')) {
      flushParagraph()
      flushList()
      blocks.push({ type: 'h2', text: trimmed.slice(3).trim() })
      continue
    }

    if (trimmed.startsWith('- ')) {
      flushParagraph()
      listItems.push(trimmed.slice(2).trim())
      continue
    }

    flushList()
    paragraph.push(trimmed)
  }

  flushParagraph()
  flushList()

  return blocks
}

function parseInline(text: string, keyPrefix: string): ReactNode[] {
  const nodes: ReactNode[] = []
  let index = 0
  let key = 0
  const className = 'text-burgundy hover:underline underline-offset-2'

  const emailPattern = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi

  const renderEmail = (email: string, wrapper?: 'strong' | 'em') => {
    const link = (
      <a
        key={`${keyPrefix}-email-${key++}`}
        href={`mailto:${email}`}
        className={className}
      >
        {email}
      </a>
    )

    if (wrapper === 'strong') {
      return <strong key={`${keyPrefix}-strong-email-${key++}`}>{link}</strong>
    }

    if (wrapper === 'em') {
      return <em key={`${keyPrefix}-em-email-${key++}`}>{link}</em>
    }

    return link
  }

  const pushTextWithEmails = (value: string, wrapper?: 'strong' | 'em') => {
    let lastIndex = 0
    let match: RegExpExecArray | null
    emailPattern.lastIndex = 0

    const pushText = (segment: string) => {
      if (wrapper === 'strong') {
        nodes.push(<strong key={`${keyPrefix}-strong-${key++}`}>{segment}</strong>)
      } else if (wrapper === 'em') {
        nodes.push(<em key={`${keyPrefix}-em-${key++}`}>{segment}</em>)
      } else {
        nodes.push(segment)
      }
    }

    while ((match = emailPattern.exec(value)) !== null) {
      if (match.index > lastIndex) {
        pushText(value.slice(lastIndex, match.index))
      }

      nodes.push(renderEmail(match[0], wrapper))
      lastIndex = emailPattern.lastIndex
    }

    if (lastIndex < value.length) {
      pushText(value.slice(lastIndex))
    }
  }

  const pushTextWithEmphasis = (value: string) => {
    const emphasisPattern = /(\*\*[^*]+\*\*|\*[^*]+\*)/g
    let lastIndex = 0
    let match: RegExpExecArray | null

    while ((match = emphasisPattern.exec(value)) !== null) {
      if (match.index > lastIndex) {
        pushTextWithEmails(value.slice(lastIndex, match.index))
      }

      const token = match[0]
      const content = token.startsWith('**') ? token.slice(2, -2) : token.slice(1, -1)

      pushTextWithEmails(content, token.startsWith('**') ? 'strong' : 'em')

      lastIndex = emphasisPattern.lastIndex
    }

    if (lastIndex < value.length) {
      pushTextWithEmails(value.slice(lastIndex))
    }
  }

  const linkPattern = /\[([^\]]+)\]\(([^)]+)\)/g
  let match: RegExpExecArray | null

  while ((match = linkPattern.exec(text)) !== null) {
    if (match.index > index) {
      pushTextWithEmphasis(text.slice(index, match.index))
    }

    const [, label, href] = match

    nodes.push(
      href.startsWith('/') ? (
        <Link key={`${keyPrefix}-link-${key++}`} href={href} className={className}>
          {label}
        </Link>
      ) : (
        <a
          key={`${keyPrefix}-link-${key++}`}
          href={href}
          target={href.startsWith('mailto:') ? undefined : '_blank'}
          rel={href.startsWith('mailto:') ? undefined : 'noopener noreferrer'}
          className={className}
        >
          {label}
        </a>
      ),
    )

    index = linkPattern.lastIndex
  }

  if (index < text.length) {
    pushTextWithEmphasis(text.slice(index))
  }

  return nodes
}

function MetaParagraph({ text }: { text: string }) {
  const cleanText = text.replace(/\*\*/g, '')
  const parts = cleanText.split(/\s+•\s+/)

  return (
    <p className="font-body text-[14px] text-text-tertiary mb-10 text-center">
      {parts.map((part, index) => (
        <span key={part}>
          {index > 0 && <span className="mx-4">&bull;</span>}
          <span>{part}</span>
        </span>
      ))}
    </p>
  )
}

export function MarkdownLegalPage({ fileName }: { fileName: string }) {
  const markdown = fs.readFileSync(path.join(process.cwd(), fileName), 'utf8')
  const blocks = parseMarkdown(markdown)
  const title = blocks.find((block) => block.type === 'h1')?.text ?? ''
  const contentBlocks = blocks.filter((block) => block.type !== 'h1')

  return (
    <div className="mx-auto max-w-[700px] px-6 py-16 md:py-20">
      <div>
        <h1 className="font-display text-5xl font-semibold text-text-primary mb-3 text-center md:text-6xl">
          {title}
        </h1>

        {contentBlocks.map((block, index) => {
          if (block.type === 'h2') {
            return (
              <h2
                key={`${block.type}-${index}`}
                className="font-display text-2xl font-semibold text-text-primary mt-10 mb-3"
              >
                {parseInline(block.text, `h2-${index}`)}
              </h2>
            )
          }

          if (block.type === 'list') {
            return (
              <ul
                key={`${block.type}-${index}`}
                className="list-disc list-outside ml-5 space-y-2 mb-3"
              >
                {block.items.map((item, itemIndex) => (
                  <li
                    key={`${index}-${itemIndex}`}
                    className="font-body text-[16px] text-text-primary leading-relaxed"
                  >
                    {parseInline(item, `li-${index}-${itemIndex}`)}
                  </li>
                ))}
              </ul>
            )
          }

          if (index === 0 && block.text.includes('Effective date:')) {
            return <MetaParagraph key={`${block.type}-${index}`} text={block.text} />
          }

          return (
            <p
              key={`${block.type}-${index}`}
              className="font-body text-[16px] text-text-primary leading-relaxed mb-3"
            >
              {parseInline(block.text, `p-${index}`)}
            </p>
          )
        })}
      </div>
    </div>
  )
}
