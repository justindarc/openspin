let _containerEl = new WeakMap();
let _slotEl = new WeakMap();
let _transitionDuration = new WeakMap();
let _lastOperation = new WeakMap();

class ViewStackElement extends HTMLElement {
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
  ::slotted(view-container) {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: 1;
  }
  ::slotted(view-container[modal]) {
    z-index: 10;
  }
  ::slotted(view-container:last-child),
  ::slotted(view-container[modal]),
  ::slotted(view-container[pop]),
  ::slotted(view-container[push]) {
    display: block;
  }
  .container {
    position: relative;
    width: 100%;
    height: 100%;
  }
  .container[data-modal]:before {
    content: '';
    background: #000;
    display: block;
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: 2;
    transition: visibility 0ms linear 200ms, opacity 200ms ease 0ms;
    visibility: hidden;
    opacity: 0;
  }
  .container[data-modal][data-in]:before {
    transition-delay: 0ms, 0ms;
    visibility: visible;
    opacity: .9;
  }

  /* [modal] */
  ::slotted(view-container[modal]) {
    transition: transform 200ms ease 0ms, opacity 200ms ease 0ms;
    transform: scale(2);
    opacity: 0;
  }
  .container[data-modal][data-in] ::slotted(view-container[modal]) {
    transform: scale(1);
    opacity: 1;
  }

  /* [transition="fade"] */
  .container[data-transition="fade"] ::slotted(view-container[pop="enter"]) {
    opacity: .9;
  }
  .container[data-transition="fade"] ::slotted(view-container[pop="leave"]) {
    opacity: 1;
  }
  .container[data-transition="fade"][data-go] ::slotted(view-container[pop="enter"]) {
    transition: opacity var(--transition-duration) ease;
    opacity: 1;
  }
  .container[data-transition="fade"][data-go] ::slotted(view-container[pop="leave"]) {
    transition: opacity var(--transition-duration) ease;
    opacity: 0;
  }
  .container[data-transition="fade"] ::slotted(view-container[push="enter"]) {
    opacity: 0;
  }
  .container[data-transition="fade"] ::slotted(view-container[push="leave"]) {
    opacity: 1;
  }
  .container[data-transition="fade"][data-go] ::slotted(view-container[push="enter"]) {
    transition: opacity var(--transition-duration) ease;
    opacity: 1;
  }
  .container[data-transition="fade"][data-go] ::slotted(view-container[push="leave"]) {
    transition: opacity var(--transition-duration) ease;
    opacity: .9;
  }

  /* [transition="fade-black"] */
  .container[data-transition="fade-black"] ::slotted(view-container[pop="enter"]),
  .container[data-transition="fade-black"] ::slotted(view-container[push="enter"]) {
    opacity: 0;
  }
  .container[data-transition="fade-black"] ::slotted(view-container[pop="leave"]),
  .container[data-transition="fade-black"] ::slotted(view-container[push="leave"]) {
    opacity: 1;
  }
  .container[data-transition="fade-black"][data-go] ::slotted(view-container[pop="enter"]),
  .container[data-transition="fade-black"][data-go] ::slotted(view-container[push="enter"]) {
    transition: opacity calc(var(--transition-duration) / 2) ease calc(var(--transition-duration) / 2);
    opacity: 1;
  }
  .container[data-transition="fade-black"][data-go] ::slotted(view-container[pop="leave"]),
  .container[data-transition="fade-black"][data-go] ::slotted(view-container[push="leave"]) {
    transition: opacity calc(var(--transition-duration) / 2) ease;
    opacity: 0;
  }

  /* [transition="slide-horizontal"] */
  .container[data-transition="slide-horizontal"] ::slotted(view-container[pop="enter"]) {
    transform: translate3d(-100%, 0, 0);
  }
  .container[data-transition="slide-horizontal"] ::slotted(view-container[pop="leave"]) {
    transform: translate3d(0, 0, 0);
  }
  .container[data-transition="slide-horizontal"][data-go] ::slotted(view-container[pop="enter"]) {
    transition: transform var(--transition-duration) ease;
    transform: translate3d(0, 0, 0);
  }
  .container[data-transition="slide-horizontal"][data-go] ::slotted(view-container[pop="leave"]) {
    transition: transform var(--transition-duration) ease;
    transform: translate3d(100%, 0, 0);
  }
  .container[data-transition="slide-horizontal"] ::slotted(view-container[push="enter"]) {
    transform: translate3d(100%, 0, 0);
  }
  .container[data-transition="slide-horizontal"] ::slotted(view-container[push="leave"]) {
    transform: translate3d(0, 0, 0);
  }
  .container[data-transition="slide-horizontal"][data-go] ::slotted(view-container[push="enter"]) {
    transition: transform var(--transition-duration) ease;
    transform: translate3d(0, 0, 0);
  }
  .container[data-transition="slide-horizontal"][data-go] ::slotted(view-container[push="leave"]) {
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

          if (activeView.onfocus) {
            activeView.onfocus();
          }
        });
      }
    });
  }

  get views() {
    return _slotEl.get(this).assignedNodes().filter((node) => {
      return node.nodeType === Node.ELEMENT_NODE && node.matches('view-container') && !node.hasAttribute('modal');
    });
  }

  get activeView() {
    let views = this.views;
    return views[views.length - 1] || null;
  }

  get modalView() {
    let modalViews = _slotEl.get(this).assignedNodes().filter((node) => {
      return node.nodeType === Node.ELEMENT_NODE && node.matches('view-container') && node.hasAttribute('modal');
    })
    return modalViews[modalViews.length - 1] || null;
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

          if (newActiveView.onfocus) {
            newActiveView.onfocus();
          }

          oldActiveView.removeAttribute('pop');
          if (oldActiveView.ondidhide) {
            oldActiveView.ondidhide();
          }

          if (oldActiveView.onblur) {
            oldActiveView.onblur();
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

          if (newActiveView.onfocus) {
            newActiveView.onfocus();
          }

          oldActiveView.removeAttribute('push');
          if (oldActiveView.ondidhide) {
            oldActiveView.ondidhide();
          }

          if (oldActiveView.onblur) {
            oldActiveView.onblur();
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

  dismissModal() {
    if (_lastOperation.get(this)) {
      return Promise.reject();
    }

    let operation = new Promise((resolve, reject) => {
      let modalView = this.modalView;
      if (!modalView) {
        reject();
        return;
      }

      let containerEl = _containerEl.get(this);

      let onTransitionEnd = () => {
        requestAnimationFrame(() => {
          modalView.removeEventListener('transitionend', onTransitionEnd);
          modalView.removeAttribute('modal');
          modalView.remove();

          delete containerEl.dataset.modal;

          let activeView = this.activeView;
          if (activeView) {
            if (activeView.onfocus) {
              activeView.onfocus();
            }
          }

          _lastOperation.set(this, null);
          resolve();
        });
      };

      setTimeout(() => {
        requestAnimationFrame(() => {
          modalView.addEventListener('transitionend', onTransitionEnd);

          delete containerEl.dataset.in;
        });
      }, modalView.transitionDelay);
    });

    operation.catch(() => _lastOperation.set(this, null));

    _lastOperation.set(this, operation);
    return operation;
  }

  presentModal(modalView) {
    if (_lastOperation.get(this)) {
      return Promise.reject();
    }

    let operation = new Promise((resolve) => {
      let onTransitionEnd = () => {
        modalView.removeEventListener('transitionend', onTransitionEnd);

        let activeView = this.activeView;
        if (activeView) {
          if (activeView.onblur) {
            activeView.onblur();
          }
        }

        _lastOperation.set(this, null);
        resolve();
      };

      setTimeout(() => {
        requestAnimationFrame(() => {
          let containerEl = _containerEl.get(this);
          containerEl.dataset.modal = true;

          requestAnimationFrame(() => {
            modalView.setAttribute('modal', true);
            this.prepend(modalView);

            requestAnimationFrame(() => {
              modalView.addEventListener('transitionend', onTransitionEnd);

              containerEl.dataset.in = true;
            });
          });
        });
      }, modalView.transitionDelay);
    });

    operation.catch(() => _lastOperation.set(this, null));

    _lastOperation.set(this, operation);
    return operation;
  }
}

exports.ViewStackElement = ViewStackElement;

customElements.define('view-stack', ViewStackElement);
