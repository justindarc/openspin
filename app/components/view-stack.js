let _containerEl = new WeakMap();
let _slotEl = new WeakMap();
let _transitionDuration = new WeakMap();
let _lastOperation = new WeakMap();

class ViewStack extends HTMLElement {
  constructor() {
    super();

    const html =
`
<style id="transition-duration">::slotted(*){--transition-duration:800ms;}</style>
<style>
  :host {
    display: block;
    width: 100vw;
    height: 100vh;
  }
  ::slotted(*) {
    display: none;
  }
  ::slotted(view-element) {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
  }
  ::slotted(view-element:last-child),
  ::slotted(view-element[pop]),
  ::slotted(view-element[push]) {
    display: block;
  }
  .container {
    position: relative;
    width: 100%;
    height: 100%;
  }

  /* [transition="fade"] */
  .container[data-transition="fade"] ::slotted(view-element[pop="enter"]) {
    opacity: .9;
  }
  .container[data-transition="fade"] ::slotted(view-element[pop="leave"]) {
    opacity: 1;
  }
  .container[data-transition="fade"][data-go] ::slotted(view-element[pop="enter"]) {
    transition: opacity var(--transition-duration) ease;
    opacity: 1;
  }
  .container[data-transition="fade"][data-go] ::slotted(view-element[pop="leave"]) {
    transition: opacity var(--transition-duration) ease;
    opacity: 0;
  }
  .container[data-transition="fade"] ::slotted(view-element[push="enter"]) {
    opacity: 0;
  }
  .container[data-transition="fade"] ::slotted(view-element[push="leave"]) {
    opacity: 1;
  }
  .container[data-transition="fade"][data-go] ::slotted(view-element[push="enter"]) {
    transition: opacity var(--transition-duration) ease;
    opacity: 1;
  }
  .container[data-transition="fade"][data-go] ::slotted(view-element[push="leave"]) {
    transition: opacity var(--transition-duration) ease;
    opacity: .9;
  }

  /* [transition="fade-black"] */
  .container[data-transition="fade-black"] ::slotted(view-element[pop="enter"]),
  .container[data-transition="fade-black"] ::slotted(view-element[push="enter"]) {
    opacity: 0;
  }
  .container[data-transition="fade-black"] ::slotted(view-element[pop="leave"]),
  .container[data-transition="fade-black"] ::slotted(view-element[push="leave"]) {
    opacity: 1;
  }
  .container[data-transition="fade-black"][data-go] ::slotted(view-element[pop="enter"]),
  .container[data-transition="fade-black"][data-go] ::slotted(view-element[push="enter"]) {
    transition: opacity calc(var(--transition-duration) / 2) ease calc(var(--transition-duration) / 2);
    opacity: 1;
  }
  .container[data-transition="fade-black"][data-go] ::slotted(view-element[pop="leave"]),
  .container[data-transition="fade-black"][data-go] ::slotted(view-element[push="leave"]) {
    transition: opacity calc(var(--transition-duration) / 2) ease;
    opacity: 0;
  }

  /* [transition="slide-horizontal"] */
  .container[data-transition="slide-horizontal"] ::slotted(view-element[pop="enter"]) {
    transform: translate3d(-100%, 0, 0);
  }
  .container[data-transition="slide-horizontal"] ::slotted(view-element[pop="leave"]) {
    transform: translate3d(0, 0, 0);
  }
  .container[data-transition="slide-horizontal"][data-go] ::slotted(view-element[pop="enter"]) {
    transition: transform var(--transition-duration) ease;
    transform: translate3d(0, 0, 0);
  }
  .container[data-transition="slide-horizontal"][data-go] ::slotted(view-element[pop="leave"]) {
    transition: transform var(--transition-duration) ease;
    transform: translate3d(100%, 0, 0);
  }
  .container[data-transition="slide-horizontal"] ::slotted(view-element[push="enter"]) {
    transform: translate3d(100%, 0, 0);
  }
  .container[data-transition="slide-horizontal"] ::slotted(view-element[push="leave"]) {
    transform: translate3d(0, 0, 0);
  }
  .container[data-transition="slide-horizontal"][data-go] ::slotted(view-element[push="enter"]) {
    transition: transform var(--transition-duration) ease;
    transform: translate3d(0, 0, 0);
  }
  .container[data-transition="slide-horizontal"][data-go] ::slotted(view-element[push="leave"]) {
    transition: transform var(--transition-duration) ease;
    transform: translate3d(-100%, 0, 0);
  }
</style>
<div class="container">
  <slot></slot>
</div>
`;

    let template = document.createElement('template');
    template.innerHTML = html;

    let shadowRoot = this.attachShadow({ mode: 'closed' });
    shadowRoot.appendChild(template.content.cloneNode(true));

    _containerEl.set(this, shadowRoot.querySelector('.container'));
    _slotEl.set(this, shadowRoot.querySelector('slot'));
    _transitionDuration.set(this, shadowRoot.querySelector('#transition-duration'));
    _lastOperation.set(this, null);

    setTimeout(() => {
      let activeView = this.activeView;
      if (activeView) {
        if (activeView.onwillshow) {
          activeView.onwillshow();
        }

        requestAnimationFrame(() => {
          if (activeView.ondidshow) {
            activeView.ondidshow();
          }
        });
      }
    });
  }

  get views() {
    return _slotEl.get(this).assignedNodes().filter((node) => {
      return node.nodeType === Node.ELEMENT_NODE && node.matches('view-element');
    });
  }

  get activeView() {
    let views = this.views;
    return views[views.length - 1] || null;
  }

  pop() {
    if (_lastOperation.get(this)) {
      return Promise.reject();
    }

    let operation = new Promise((resolve, reject) => {
      let views = this.views;
      let count = views.length;
      if (count < 2) {
        reject();
        return;
      }

      let oldActiveView = views[count - 1];
      oldActiveView.setAttribute('pop', 'leave');
      if (oldActiveView.onwillhide) {
        oldActiveView.onwillhide();
      }

      let newActiveView = views[count - 2];
      newActiveView.setAttribute('pop', 'enter');
      if (newActiveView.onwillshow) {
        newActiveView.onwillshow();
      }

      let containerEl = _containerEl.get(this);

      let onTransitionEnd = () => {
        newActiveView.removeEventListener('transitionend', onTransitionEnd);

        requestAnimationFrame(() => {
          oldActiveView.remove();

          delete containerEl.dataset.transition;
          delete containerEl.dataset.go;

          newActiveView.removeAttribute('pop');
          if (newActiveView.ondidshow) {
            newActiveView.ondidshow();
          }

          oldActiveView.removeAttribute('pop');
          if (oldActiveView.ondidhide) {
            oldActiveView.ondidhide();
          }

          _lastOperation.set(this, null);
          resolve();
        });
      };

      setTimeout(() => {
        requestAnimationFrame(() => {
          containerEl.dataset.transition = oldActiveView.transition;
          _transitionDuration.get(this).innerHTML = '::slotted(*){--transition-duration:' + oldActiveView.transitionDuration + 'ms;}';

          requestAnimationFrame(() => {
            newActiveView.addEventListener('transitionend', onTransitionEnd);

            containerEl.dataset.go = true;
          });
        });
      }, oldActiveView.transitionDelay);
    });

    operation.catch(() => _lastOperation.set(this, null));

    _lastOperation.set(this, operation);
    return operation;
  }

  push(newActiveView) {
    if (_lastOperation.get(this)) {
      return Promise.reject();
    }

    let operation = new Promise((resolve, reject) => {
      let oldActiveView = this.activeView;
      if (!oldActiveView || !newActiveView) {
        reject();
        return;
      }

      oldActiveView.setAttribute('push', 'leave');
      if (oldActiveView.onwillhide) {
        oldActiveView.onwillhide();
      }

      newActiveView.setAttribute('push', 'enter');
      if (newActiveView.onwillshow) {
        newActiveView.onwillshow();
      }

      let containerEl = _containerEl.get(this);

      let onTransitionEnd = () => {
        newActiveView.removeEventListener('transitionend', onTransitionEnd);

        requestAnimationFrame(() => {
          delete containerEl.dataset.transition;
          delete containerEl.dataset.go;

          newActiveView.removeAttribute('push');
          if (newActiveView.ondidshow) {
            newActiveView.ondidshow();
          }

          oldActiveView.removeAttribute('push');
          if (oldActiveView.ondidhide) {
            oldActiveView.ondidhide();
          }

          _lastOperation.set(this, null);
          resolve();
        });
      };

      setTimeout(() => {
        requestAnimationFrame(() => {
          this.appendChild(newActiveView);

          containerEl.dataset.transition = newActiveView.transition;
          _transitionDuration.get(this).innerHTML = '::slotted(*){--transition-duration:' + newActiveView.transitionDuration + 'ms;}';

          requestAnimationFrame(() => {
            newActiveView.addEventListener('transitionend', onTransitionEnd);

            containerEl.dataset.go = true;
          });
        });
      }, newActiveView.transitionDelay);
    });

    operation.catch(() => _lastOperation.set(this, null));

    _lastOperation.set(this, operation);
    return operation;
  }
}

exports.ViewStack = ViewStack;

customElements.define('view-stack', ViewStack);
