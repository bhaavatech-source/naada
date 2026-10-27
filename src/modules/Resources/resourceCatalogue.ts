import library from '../../data/master-music-books-library.json'

export type CatalogueKind = 'book' | 'paper'
export type CatalogueItem = {
  id: string
  kind: CatalogueKind
  title: string
  author: string
  year: string
  publication: string
  category: string
  description: string
  url: string
  notebookSource: boolean
  access: string
  doi?: string
  linkType?: string
}

export function sourceUrl(value: string): string | null {
  try {
    const url = new URL(value)
    return url.protocol === 'https:' || url.protocol === 'http:' ? url.href : null
  } catch {
    return null
  }
}

export const CATALOGUE: CatalogueItem[] = [
  ...library.books.map(book => ({
    id: book.id,
    kind: 'book' as const,
    title: book.title,
    author: book.author,
    year: String(book.year),
    publication: book.publisher,
    category: book.category,
    description: book.description,
    url: book.url,
    notebookSource: book.is_notebook_source,
    access: 'Check access on source website',
  })),
  ...library.research_papers.map(paper => ({
    id: paper.id,
    kind: 'paper' as const,
    title: paper.title,
    author: paper.authors.join(', '),
    year: String(paper.year),
    publication: paper.publication,
    category: paper.category,
    description: paper.description,
    url: paper.url,
    notebookSource: false,
    access: paper.access_type,
    doi: paper.doi ?? undefined,
    linkType: paper.link_type,
  })),
]

export const CATALOGUE_POLICY = library.resource_policy
export const catalogueText = (value: string) => value.normalize('NFKD').replace(/\p{M}/gu, '').toLocaleLowerCase().trim()

export type CatalogueFilters = {
  query: string
  kind: 'all' | CatalogueKind
  category: string
  notebookOnly: boolean
  sort: 'title' | 'newest' | 'oldest'
}

export function catalogueCategories(kind: CatalogueFilters['kind']): string[] {
  return [...new Set(CATALOGUE.filter(item => kind === 'all' || item.kind === kind).map(item => item.category))]
    .sort((a, b) => a.localeCompare(b))
}

export function filterCatalogue(filters: CatalogueFilters): CatalogueItem[] {
  const terms = catalogueText(filters.query).split(/\s+/).filter(Boolean)
  return CATALOGUE.filter(item => {
    if (filters.kind !== 'all' && item.kind !== filters.kind) return false
    if (filters.category && item.category !== filters.category) return false
    if (filters.notebookOnly && !item.notebookSource) return false
    const text = catalogueText([item.title, item.author, item.publication, item.category, item.description, item.year, item.doi ?? ''].join(' '))
    return terms.every(term => text.includes(term))
  }).sort((a, b) => {
    if (filters.sort !== 'title') {
      const yearA = Number(a.year.match(/\d{4}/)?.[0])
      const yearB = Number(b.year.match(/\d{4}/)?.[0])
      if (!yearA && yearB) return 1
      if (yearA && !yearB) return -1
      const difference = filters.sort === 'newest' ? yearB - yearA : yearA - yearB
      if (difference) return difference
    }
    return a.title.localeCompare(b.title) || a.id.localeCompare(b.id)
  })
}
