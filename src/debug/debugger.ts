import { isNumber, isString } from '@src/lib/typeguard';

const debugView = ((): HTMLDivElement => {
  const debugView = document.createElement('div');
  debugView.style.position = 'fixed';
  debugView.style.width = `400px`;
  debugView.style.height = `600px`;
  debugView.style.zIndex = '100';
  debugView.style.right = '0';
  debugView.style.top = '0';
  debugView.style.backgroundColor = 'rgb(255,0,0,0.4)';
  document.body.appendChild(debugView);
  return debugView;
})();

export interface MessageInfo {
  id: number;
  key: string;
  html: string;
}

const isMessageInfo = (v: unknown): v is MessageInfo => {
  const i = v as MessageInfo;
  return (
    i !== undefined && isNumber(i.id) && isString(i.key) && isString(i.html)
  );
};

function onDebugMessage(ev: MessageEvent): void {
  if (isMessageInfo(ev.data)) {
    if (!ev.data.key) {
      console.error('invalid message', ev);
    }
    const debugItemKey = `debug-${ev.data.key}`;
    let debugItemElement = document.getElementById(debugItemKey);
    if (!debugItemElement) {
      const newDebugItem = document.createElement('div');
      newDebugItem.id = debugItemKey;
      newDebugItem.style.width = '100%';
      debugView.append(newDebugItem);
      debugItemElement = newDebugItem;
    }
    debugItemElement.innerHTML = ev.data.html;
  }
}

window.addEventListener('message', onDebugMessage, false);
