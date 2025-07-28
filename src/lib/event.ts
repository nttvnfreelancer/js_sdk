// createEvent create an new Event with IE11-compatibility
export const createEvent = (ev: string): Event => {
  if (typeof Event === 'function') {
    return new Event(ev);
  }
  const event = document.createEvent('Event');
  event.initEvent(ev, false, true);
  return event;
};

export const createCustomEvent = (
  ev: string,
  obj: CustomObject
): CustomEvent<unknown> => {
  if (typeof Event === 'function') {
    return new CustomEvent(ev, obj);
  }
  const event = document.createEvent('CustomEvent');
  event.initCustomEvent(ev, false, false, obj.detail);
  return event;
};

export interface CustomObject {
  detail: unknown;
}
