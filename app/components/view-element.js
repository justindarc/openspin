let _onwillshow = new WeakMap();
let _ondidshow = new WeakMap();
let _onwillhide = new WeakMap();
let _ondidhide = new WeakMap();

class ViewElement extends HTMLElement {
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
  }

  get transition() {
    return this.getAttribute('transition') || 'none';
  }

  set transition(value) {
    this.setAttribute('transition', value);
  }

  get transitionDuration() {
    return parseInt(this.getAttribute('transition-duration') || '800', 10);
  }

  set transitionDuration(value) {
    if (typeof value === 'number') {
      this.setAttribute('transition-duration', value);
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
}

exports.ViewElement = ViewElement;

customElements.define('view-element', ViewElement);

class ViewController {
  constructor(view) {
    this.view = view;

    view.onwillshow = this.onWillShow;
    view.ondidshow = this.onDidShow;
    view.onwillhide = this.onWillHide;
    view.ondidhide = this.onDidHide;
  }

  onWillShow() {}
  onDidShow() {}
  onWillHide() {}
  onDidHide() {}
}

exports.ViewController = ViewController;
