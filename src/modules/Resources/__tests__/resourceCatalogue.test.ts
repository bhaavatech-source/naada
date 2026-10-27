import { CATALOGUE, catalogueCategories, catalogueText, filterCatalogue, sourceUrl, type CatalogueFilters } from '../resourceCatalogue'

export function runResourceTests(): number {
  let count = 0
  const check = (condition: boolean, message: string) => {
    if (!condition) throw new Error(`Resources catalogue: ${message}`)
    count++
  }
  const defaults: CatalogueFilters = { query: '', kind: 'all', category: '', notebookOnly: false, sort: 'title' }
  check(CATALOGUE.length === 328, 'all 308 books and 20 papers are integrated')
  check(CATALOGUE.filter(item => item.kind === 'book').length === 308, 'book count comes from records')
  check(CATALOGUE.filter(item => item.kind === 'paper').length === 20, 'paper count comes from records')
  check(new Set(CATALOGUE.map(item => item.id)).size === CATALOGUE.length, 'all catalogue keys are unique')
  for (const item of CATALOGUE) {
    check(!!(item.title && item.author && item.publication && item.category), `${item.id}: complete displayed metadata`)
    check(sourceUrl(item.url) !== null, `${item.id}: safe external source link`)
  }
  check(sourceUrl('javascript:alert(1)') === null, 'non-web protocols cannot be opened')
  check(sourceUrl('data:text/html,test') === null, 'data links are rejected')
  check(sourceUrl('not a url') === null, 'invalid links are rejected explicitly')
  check(sourceUrl('https://archive.org/details/test') === 'https://archive.org/details/test', 'original external source URL is preserved')
  check(catalogueText('  Rāga Lakṣaṇa  ') === 'raga laksana', 'search ignores IAST diacritics and case')
  check(filterCatalogue(defaults).length === CATALOGUE.length, 'initial filter includes every entry')
  check(filterCatalogue({ ...defaults, query: 'Swami Prajnanananda' }).some(item => item.id === 'NB-003'), 'author search')
  check(filterCatalogue({ ...defaults, query: '  historical   study ' }).some(item => item.id === 'NB-003'), 'multi-word search ignores extra whitespace')
  const paper = CATALOGUE.find(item => item.kind === 'paper' && item.doi)
  if (!paper?.doi) throw new Error('Expected research paper with DOI')
  check(filterCatalogue({ ...defaults, query: paper.doi }).some(item => item.id === paper.id), 'DOI search')
  check(filterCatalogue({ ...defaults, kind: 'paper' }).every(item => item.kind === 'paper'), 'paper type filter')
  check(filterCatalogue({ ...defaults, kind: 'book', notebookOnly: true }).length === 32, 'notebook-source filter uses source flags')
  check(filterCatalogue({ ...defaults, kind: 'paper', notebookOnly: true }).length === 0, 'notebook flag does not accidentally select research')
  check(catalogueCategories('book').includes('Instrumental Organology & Physics'), 'subjects include actual record categories missing from top-level list')
  for (const category of catalogueCategories('all')) {
    const matches = filterCatalogue({ ...defaults, category })
    check(matches.length > 0 && matches.every(item => item.category === category), `${category}: subject filtering`)
  }
  const byYear = (item: typeof CATALOGUE[number]) => Number(item.year.match(/\d{4}/)?.[0])
  const newest = filterCatalogue({ ...defaults, sort: 'newest' }).map(byYear).filter(Boolean)
  const oldest = filterCatalogue({ ...defaults, sort: 'oldest' }).map(byYear).filter(Boolean)
  check(newest.every((year, i) => !i || newest[i - 1] >= year), 'newest-first sort')
  check(oldest.every((year, i) => !i || oldest[i - 1] <= year), 'oldest-first sort')
  check(filterCatalogue({ ...defaults, query: 'no-such-resource-zz999' }).length === 0, 'empty searches return no invented fallback')
  return count
}
