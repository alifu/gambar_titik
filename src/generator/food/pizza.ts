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

function mushroom(x: number, y: number): Shape {
  return union(ellipse(x, y, 4.2, 2.8), rect(x - 1.6, y, x + 1.6, y + 4))
}

function wholePizza(rng: Rng, topping: 'pepperoni' | 'mushroom'): Layer[] {
  const cheese = polar(CENTER[0], CENTER[1], (angle) => 20 + Math.sin(angle * 7) * 0.9)
  const spots = scatter(rng, 8, circle(CENTER[0], CENTER[1], 15), 10)
  const toppings =
    topping === 'pepperoni'
      ? [paint(union(...spots.map(([x, y]) => circle(x, y, 3.8))), PEPPERONI)]
      : [
          paint(union(...spots.slice(0, 5).map(([x, y]) => mushroom(x, y))), '#e8dcc8'),
          paint(union(...spots.slice(5).map(([x, y]) => ellipse(x, y, 3.4, 2, 0.7))), '#4caf50'),
        ]
  return [paint(circle(CENTER[0], CENTER[1], 24), CRUST), paint(cheese, CHEESE), ...toppings]
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
    const layers =
      variant === 2 ? slice() : wholePizza(rng, variant === 0 ? 'pepperoni' : 'mushroom')
    return { title: `Pizza ${variantOf(names, variant)}`, layers: [...layers] }
  },
}
