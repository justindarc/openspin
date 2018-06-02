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

module.exports = ViewController;
