let _onconnected = new WeakMap();
let _ondisconnected = new WeakMap();
let _onwillshow = new WeakMap();
let _ondidshow = new WeakMap();
let _onwillhide = new WeakMap();
let _ondidhide = new WeakMap();
let _onblur = new WeakMap();
let _onfocus = new WeakMap();

class ViewContainerElement extends HTMLElement {
  constructor() {
    super();

    const html =
`
<style>
  :host {
    display: none;
  }
</style>
<slot></slot>
`;

    let template = document.createElement('template');
    template.innerHTML = html;

    let shadowRoot = this.attachShadow({ mode: 'closed' });
    shadowRoot.appendChild(template.content.cloneNode(true));

    if (this.hasAttribute('onconnected')) {
      this.onconnected = new Function(this.getAttribute('onconnected'));
    }

    if (this.hasAttribute('ondisconnected')) {
      this.ondisconnected = new Function(this.getAttribute('ondisconnected'));
    }

    if (this.hasAttribute('onwillshow')) {
      this.onwillshow = new Function(this.getAttribute('onwillshow'));
    }

    if (this.hasAttribute('ondidshow')) {
      this.ondidshow = new Function(this.getAttribute('ondidshow'));
    }

    if (this.hasAttribute('onwillhide')) {
      this.onwillhide = new Function(this.getAttribute('onwillhide'));
    }

    if (this.hasAttribute('ondidhide')) {
      this.ondidhide = new Function(this.getAttribute('ondidhide'));
    }

    if (this.hasAttribute('onblur')) {
      this.onblur = new Function(this.getAttribute('onblur'));
    }

    if (this.hasAttribute('onfocus')) {
      this.onfocus = new Function(this.getAttribute('onfocus'));
    }
  }

  connectedCallback() {
    let onconnected = this.onconnected;
    if (onconnected) {
      onconnected.call(this);
    }
  }

  disconnectedCallback() {
    let ondisconnected = this.ondisconnected;
    if (ondisconnected) {
      ondisconnected.call(this);
    }
  }

  get transition() {
    return this.getAttribute('transition') || 'none';
  }

  set transition(value) {
    this.setAttribute('transition', value);
  }

  get transitionDelay() {
    return parseInt(this.getAttribute('transition-delay') || '400', 10);
  }

  set transitionDelay(value) {
    if (typeof value === 'number') {
      this.setAttribute('transition-delay', value);
    }
  }

  get transitionDuration() {
    return parseInt(this.getAttribute('transition-duration') || '800', 10);
  }

  set transitionDuration(value) {
    if (typeof value === 'number') {
      this.setAttribute('transition-duration', value);
    }
  }

  get onconnected() {
    return _onconnected.get(this) || null;
  }

  set onconnected(value) {
    if (typeof value === 'function' || value === null) {
      _onconnected.set(this, value);
    }
  }

  get ondisconnected() {
    return _ondisconnected.get(this) || null;
  }

  set ondisconnected(value) {
    if (typeof value === 'function' || value === null) {
      _ondisconnected.set(this, value);
    }
  }

  get onwillshow() {
    return _onwillshow.get(this) || null;
  }

  set onwillshow(value) {
    if (typeof value === 'function' || value === null) {
      _onwillshow.set(this, value);
    }
  }

  get ondidshow() {
    return _ondidshow.get(this) || null;
  }

  set ondidshow(value) {
    if (typeof value === 'function' || value === null) {
      _ondidshow.set(this, value);
    }
  }

  get onwillhide() {
    return _onwillhide.get(this) || null;
  }

  set onwillhide(value) {
    if (typeof value === 'function' || value === null) {
      _onwillhide.set(this, value);
    }
  }

  get ondidhide() {
    return _ondidhide.get(this) || null;
  }

  set ondidhide(value) {
    if (typeof value === 'function' || value === null) {
      _ondidhide.set(this, value);
    }
  }

  get onblur() {
    return _onblur.get(this) || null;
  }

  set onblur(value) {
    if (typeof value === 'function' || value === null) {
      _onblur.set(this, value);
    }
  }

  get onfocus() {
    return _onfocus.get(this) || null;
  }

  set onfocus(value) {
    if (typeof value === 'function' || value === null) {
      _onfocus.set(this, value);
    }
  }
}

exports.ViewContainerElement = ViewContainerElement;

customElements.define('view-container', ViewContainerElement);

class ViewController {
  constructor(view) {
    this.view = view;

    view.onwillshow = () => this.onWillShow();
    view.ondidshow = () => this.onDidShow();
    view.onwillhide = () => this.onWillHide();
    view.ondidhide = () => this.onDidHide();
    view.onblur = () => this.onBlur();
    view.onfocus = () => this.onFocus();
  }

  onWillShow() {}
  onDidShow() {}
  onWillHide() {}
  onDidHide() {}
  onBlur() {}
  onFocus() {}
}

exports.ViewController = ViewController;
