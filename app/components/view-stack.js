let _containerEl = new WeakMap();

class ViewStack extends HTMLElement {
  constructor() {
    super();

    const html =
`
<style>
  :host {
    display: block;
  }
  .container {
    width: 100%;
    height: 100%;
  }
</style>
<div class="container"></div>
`;

    let template = document.createElement('template');
    template.innerHTML = html;

    let shadowRoot = this.attachShadow({ mode: 'closed' });
    shadowRoot.appendChild(template.content.cloneNode(true));

    _containerEl.set(this, shadowRoot.querySelector('.container'));
  }
}

customElements.define('view-stack', ViewStack);
