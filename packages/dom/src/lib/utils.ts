export const matchByRole = (element: Element, roles: string[]) =>
  element.matches(roles.map((role) => `[role="${role}"]`).join(','));

export const matchByTagName = (element: Element, tagNames: string[]) =>
  tagNames.includes(element.tagName.toLowerCase());
