import { useMemo, useRef, useState } from 'react'
import { BookOpen, FileText, ExternalLink, Search, RotateCcw, ChevronLeft, ChevronRight, LibraryBig } from 'lucide-react'
import {
  CATALOGUE, CATALOGUE_POLICY, catalogueCategories, filterCatalogue, sourceUrl,
  type CatalogueFilters,
} from './resourceCatalogue'

const PAGE_SIZE = 12
const INITIAL_FILTERS: CatalogueFilters = { query: '', kind: 'all', category: '', notebookOnly: false, sort: 'title' }

export function BooksLibrary() {
  const [filters, setFilters] = useState<CatalogueFilters>(INITIAL_FILTERS)
  const [page, setPage] = useState(1)
  const resultsHeading = useRef<HTMLHeadingElement>(null)
  const items = useMemo(() => filterCatalogue(filters), [filters])
  const categories = useMemo(() => catalogueCategories(filters.kind), [filters.kind])
  const pageCount = Math.max(1, Math.ceil(items.length / PAGE_SIZE))
  const currentPage = Math.min(page, pageCount)
  const offset = (currentPage - 1) * PAGE_SIZE
  const updateFilters = (patch: Partial<CatalogueFilters>) => {
    setFilters(current => ({ ...current, ...patch }))
    setPage(1)
  }
  const reset = () => { setFilters(INITIAL_FILTERS); setPage(1) }
  const changePage = (next: number) => {
    setPage(next)
    resultsHeading.current?.focus({ preventScroll: true })
    resultsHeading.current?.scrollIntoView({ block: 'start' })
  }
  const hasFilters = !!(filters.query || filters.category || filters.kind !== 'all' || filters.notebookOnly || filters.sort !== 'title')

  return <section className="resource-library" aria-labelledby="books-library-title">
    <div className="resources-section-heading">
      <div>
        <p className="resources-eyebrow">THE READING ROOM</p>
        <h2 id="books-library-title">Books & research library</h2>
        <p>Discover music theory, notation, history, rhythm, and research. Search by title, author, subject, or DOI.</p>
      </div>
      <span className="resources-count">{CATALOGUE.length} catalogue entries</span>
    </div>

    <aside className="resources-notice" aria-label="Catalogue access and quality">
      <BookOpen size={20} aria-hidden="true" />
      <div>
        <strong>A guide to sources, not a full-text collection</strong>
        <p>{CATALOGUE_POLICY.access_note} These supplied catalogue records have not been independently verified by this app. Titles, links, and availability may need checking.</p>
        <p>Books and papers open on their source websites. No full books or papers are hosted here. Music therapy research is educational, not medical advice or proof of a treatment benefit.</p>
      </div>
    </aside>

    <div className="resources-filter-panel">
      <label className="resources-search">
        <Search size={19} aria-hidden="true" />
        <span className="resources-sr-only">Search books and research</span>
        <input type="search" value={filters.query} placeholder="Title, author, subject, DOI…"
          onChange={event => updateFilters({ query: event.target.value })} />
      </label>
      <div className="resources-library-filters">
        <label>Resource type
          <select value={filters.kind} onChange={event => {
            const kind = event.target.value
            if (kind === 'all' || kind === 'book' || kind === 'paper') updateFilters({ kind, category: '', notebookOnly: false })
          }}>
            <option value="all">Books & research</option>
            <option value="book">Books ({CATALOGUE.filter(item => item.kind === 'book').length})</option>
            <option value="paper">Research papers ({CATALOGUE.filter(item => item.kind === 'paper').length})</option>
          </select>
        </label>
        <label>Subject
          <select value={filters.category} onChange={event => updateFilters({ category: event.target.value })}>
            <option value="">All subjects</option>
            {categories.map(category => <option key={category} value={category}>{category}</option>)}
          </select>
        </label>
        <label>Sort by
          <select value={filters.sort} onChange={event => {
            const sort = event.target.value
            if (sort === 'title' || sort === 'newest' || sort === 'oldest') updateFilters({ sort })
          }}>
            <option value="title">Title A–Z</option><option value="newest">Year: newest first</option><option value="oldest">Year: oldest first</option>
          </select>
        </label>
      </div>
      <div className="resources-filter-footer">
        <label className="resources-checkbox">
          <input type="checkbox" checked={filters.notebookOnly} disabled={filters.kind === 'paper'}
            onChange={event => updateFilters({ notebookOnly: event.target.checked })} />
          Notebook sources only
        </label>
        <button type="button" className="resources-button resources-button-quiet" onClick={reset} disabled={!hasFilters}><RotateCcw size={15} aria-hidden="true" /> Reset filters</button>
      </div>
    </div>

    <div className="resources-results-heading">
      <h3 ref={resultsHeading} tabIndex={-1}>Explore the catalogue</h3>
      <p role="status" aria-live="polite">{items.length ? `Showing ${offset + 1}–${Math.min(offset + PAGE_SIZE, items.length)} of ${items.length} entries` : 'No matching entries'}</p>
    </div>

    {items.length ? <>
      <div className="resources-catalogue-grid">
        {items.slice(offset, offset + PAGE_SIZE).map(item => {
          const url = sourceUrl(item.url)
          const Icon = item.kind === 'book' ? BookOpen : FileText
          return <article className={`resources-book-card resources-book-card--${item.kind}`} key={item.id}>
            <div className="resources-book-top">
              <span className="resources-book-icon"><Icon size={22} aria-hidden="true" /></span>
              <span className="resources-badge">{item.kind === 'book' ? 'Book / reference' : 'Research paper'}</span>
              <span className="resources-book-year">{item.year}</span>
            </div>
            <p className="resources-book-category">{item.category}</p>
            <h4>{item.title}</h4>
            <p className="resources-book-author">{item.author}</p>
            <p className="resources-book-description">{item.description}</p>
            <dl className="resources-book-details">
              <div><dt>{item.kind === 'book' ? 'Publisher' : 'Publication'}</dt><dd>{item.publication}</dd></div>
              {item.doi && <div><dt>DOI</dt><dd>{item.doi}</dd></div>}
            </dl>
            {item.notebookSource && <span className="resources-notebook-badge">Notebook source</span>}
            <div className="resources-book-action">
              <p>{item.kind === 'paper' ? `Catalogue access: ${item.access}` : item.access}</p>
              {url ? <a className="resources-button resources-button-primary" href={url} target="_blank" rel="noopener noreferrer"
                aria-label={`View source for ${item.title} (opens in a new tab)`}>View source <ExternalLink size={15} aria-hidden="true" /></a>
                : <p role="alert">Source link unavailable: invalid web address in catalogue.</p>}
              <span>{url ? new URL(url).hostname.replace(/^www\./, '') : item.id}</span>
            </div>
          </article>
        })}
      </div>
      <nav className="resources-pagination" aria-label="Catalogue pagination">
        <button className="resources-button" type="button" disabled={currentPage === 1} onClick={() => changePage(currentPage - 1)}><ChevronLeft size={17} aria-hidden="true" /> Previous</button>
        <span aria-current="page">Page {currentPage} of {pageCount}</span>
        <button className="resources-button" type="button" disabled={currentPage === pageCount} onClick={() => changePage(currentPage + 1)}>Next <ChevronRight size={17} aria-hidden="true" /></button>
      </nav>
    </> : <div className="resources-empty">
      <LibraryBig size={36} aria-hidden="true" />
      <h3>No matching books or papers</h3>
      <p>Try a shorter search, another subject, or reset the filters to see the full library.</p>
      <button type="button" className="resources-button resources-button-primary" onClick={reset}><RotateCcw size={16} aria-hidden="true" /> Reset filters</button>
    </div>}
  </section>
}
