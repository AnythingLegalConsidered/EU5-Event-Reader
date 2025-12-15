class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}

// @ts-ignore
global.ResizeObserver = ResizeObserver;

Object.defineProperty(HTMLElement.prototype, 'getBoundingClientRect', {
  value: () => ({ width: 800, height: 600, top: 0, left: 0, right: 0, bottom: 0 }),
  writable: true
});
