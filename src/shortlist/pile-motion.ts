type Rect = { left: number; top: number; width: number; height: number }

export function returnTransform(card: Rect, stack: Rect): string {
  const dx = stack.left + stack.width / 2 - card.left - card.width / 2
  const dy = stack.top + stack.height / 2 - card.top - card.height / 2
  const scale = Math.min(stack.width / card.width, stack.height / card.height)
  return `translate(${dx}px, ${dy}px) scale(${scale})`
}
