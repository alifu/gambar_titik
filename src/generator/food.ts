import type { Subject } from './design.ts'
import { apple } from './food/apple.ts'
import { bread } from './food/bread.ts'
import { burger } from './food/burger.ts'
import { cake } from './food/cake.ts'
import { donut } from './food/donut.ts'
import { egg } from './food/egg.ts'
import { iceCream } from './food/icecream.ts'
import { noodle } from './food/noodle.ts'
import { pizza } from './food/pizza.ts'
import { sushi } from './food/sushi.ts'
import { watermelon } from './food/watermelon.ts'

export const foodSubjects: readonly Subject[] = [
  apple,
  burger,
  pizza,
  cake,
  iceCream,
  donut,
  sushi,
  watermelon,
  bread,
  egg,
  noodle,
]
