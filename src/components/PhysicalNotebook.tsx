import './PhysicalNotebook.css';

export type PhysicalNotebookProps = {
  opening: boolean;
};

const pages = Array.from({ length: 7 }, (_, index) => index + 1);

const PaperFace = ({ side, page }: { side: 'front' | 'back'; page: number }) => (
  <div className={`pp-book-face pp-book-paper-${side}`} aria-hidden="true">
    <span className="pp-book-page-number">{page === 1 ? 'write two names' : '♡'}</span>
    <i /><i /><i />
  </div>
);

export const PhysicalNotebook = ({ opening }: PhysicalNotebookProps) => (
  <div className={`pp-book-scene ${opening ? 'is-opening' : ''}`} aria-label="A pink physical notebook opening" role="img">
    <div className="pp-book-stage">
      <div className="pp-book-back" />
      <div className="pp-book-paper-block" aria-hidden="true" />
      <div className="pp-book-spine" aria-hidden="true"><i /><i /><i /><i /><i /></div>

      <div className="pp-book-pages">
        {pages.map((page) => (
          <div className={`pp-book-page pp-book-page-${page}`} key={page}>
            <PaperFace side="front" page={page} />
            <PaperFace side="back" page={page} />
          </div>
        ))}
      </div>

      <div className="pp-book-cover">
        <div className="pp-book-cover-front">
          <div className="pp-book-binding"><i /><i /><i /><i /><i /></div>
          <div className="pp-book-cover-title"><span>my</span><strong>NOTEBOOK</strong><small>paper games &amp; big feelings</small></div>
          <div className="pp-book-xoxo">xoxo</div>
        </div>
        <div className="pp-book-cover-back" aria-hidden="true" />
      </div>
    </div>
  </div>
);

export default PhysicalNotebook;
