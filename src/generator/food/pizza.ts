import { tablecloth, woodTable } from '../backdrops.ts'
import { INK, type Design, type Subject, variantOf } from '../design.ts'
import { type Rng } from '../random.ts'
import {
  capsule,
  circle,
  ellipse,
  inkLayer,
  paint,
  polar,
  polygon,
  rect,
  roundRect,
  union,
  type Layer,
  type Point,
  type Shape,
} from '../raster.ts'
import { scatter } from '../scatter.ts'

const CENTER: Point = [32, 33]
const CRUST = '#e0a052'
const CHEESE = '#ffd15c'
const PEPPERONI = '#c0392b'
const SLICE_COUNT = 6

function sliceLines(): Layer {
  const lines = Array.from({ length: SLICE_COUNT / 2 }, (_, index) => {
    const angle = (index * Math.PI * 2) / SLICE_COUNT + 0.3
    const dx = Math.cos(angle) * 22
    const dy = Math.sin(angle) * 22
    return capsule([CENTER[0] - dx, CENTER[1] - dy], [CENTER[0] + dx, CENTER[1] + dy], 0.6)
  })
  return inkLayer(union(...lines), '#b5651d')
}

function mushroom(x: number, y: number): Shape {
  return union(ellipse(x, y, 3.6, 2.4), rect(x - 1.2, y, x + 1.2, y + 3.4))
}

function wholePizza(rng: Rng, topping: 'pepperoni' | 'mushroom'): Layer[] {
  const cheese = polar(CENTER[0], CENTER[1], (angle) => 20 + Math.sin(angle * 7) * 0.9)
  const spots = scatter(rng, 9, circle(CENTER[0], CENTER[1], 16), 8)
  const toppings =
    topping === 'pepperoni'
      ? [paint(union(...spots.map(([x, y]) => circle(x, y, 3))), PEPPERONI)]
      : [
          paint(union(...spots.slice(0, 5).map(([x, y]) => mushroom(x, y))), '#e8dcc8'),
          paint(union(...spots.slice(5).map(([x, y]) => ellipse(x, y, 2.6, 1.6, 0.7))), '#4caf50'),
        ]
  return [
    paint(circle(CENTER[0], CENTER[1] + 1.5, 24.5), '#b5651d'),
    paint(circle(CENTER[0], CENTER[1], 24), CRUST),
    paint(cheese, CHEESE),
    ...toppings,
    sliceLines(),
  ]
}

function slice(): Layer[] {
  const cheese = polygon([
    [11, 16],
    [53, 16],
    [32, 58],
  ])
  const drips = union(circle(20, 18, 2.5), circle(44, 19, 2.5))
  const pepperoni = union(
    circle(25, 24, 3.6),
    circle(39, 25, 3.6),
    circle(32, 37, 3.4),
    circle(32, 48, 2.6),
  )
  return [
    paint(union(cheese, drips), CHEESE),
    paint(pepperoni, PEPPERONI),
    paint(roundRect(7, 9, 57, 18, 4.5), CRUST),
    inkLayer(union(capsule([16, 13], [22, 13], 0.6), capsule([40, 13], [47, 13], 0.6)), INK),
  ]
}

export const pizza: Subject = {
  key: 'pizza',
  count: 3,
  create: (rng: Rng, variant: number): Design => {
    const names = ['Pepperoni', 'Jamur', 'Sepotong'] as const
    const backdrop =
      variant === 2 ? tablecloth('#fff8e1', '#81c784', 30) : woodTable('#fde2c4', '#c98b5a', 0)
    const layers =
      variant === 2 ? slice() : wholePizza(rng, variant === 0 ? 'pepperoni' : 'mushroom')
    return { title: `Pizza ${variantOf(names, variant)}`, layers: [...backdrop, ...layers] }
  },
}
