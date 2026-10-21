/** Install only while a form has unsaved work. No draft content is stored. */
export function protectUnsavedForm(onBlocked: () => void): () => void {
  function beforeUnload(event: BeforeUnloadEvent) {
    event.preventDefault();
    event.returnValue = '';
  }

  function beforeLink(event: MouseEvent) {
    if (
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    )
      return;
    if (!(event.target instanceof Element)) return;
    const exitButton = event.target.closest('button[data-leaves-page]');
    if (exitButton) {
      event.preventDefault();
      event.stopPropagation();
      onBlocked();
      return;
    }
    const link = event.target.closest<HTMLAnchorElement>('a[href]');
    if (
      !link ||
      link.hasAttribute('download') ||
      (link.target && link.target !== '_self')
    )
      return;
    let destination: URL;
    try {
      destination = new URL(link.href, window.location.href);
    } catch {
      return;
    }
    if (!['http:', 'https:'].includes(destination.protocol)) return;
    const current = new URL(window.location.href);
    // In-page anchors do not discard the form. New tabs and downloads are also safe.
    if (
      destination.origin === current.origin &&
      destination.pathname === current.pathname &&
      destination.search === current.search
    )
      return;
    event.preventDefault();
    event.stopPropagation();
    onBlocked();
  }

  window.addEventListener('beforeunload', beforeUnload);
  document.addEventListener('click', beforeLink, { capture: true });
  return () => {
    window.removeEventListener('beforeunload', beforeUnload);
    document.removeEventListener('click', beforeLink, { capture: true });
  };
}
