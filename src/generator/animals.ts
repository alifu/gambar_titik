import { bear } from './animals/bear.ts'
import { bird } from './animals/bird.ts'
import { cat } from './animals/cat.ts'
import { dog } from './animals/dog.ts'
import { elephant } from './animals/elephant.ts'
import { fish } from './animals/fish.ts'
import { fox } from './animals/fox.ts'
import { frog } from './animals/frog.ts'
import { owl } from './animals/owl.ts'
import { rabbit } from './animals/rabbit.ts'
import { turtle } from './animals/turtle.ts'
import type { Subject } from './design.ts'

export const animalSubjects: readonly Subject[] = [
  cat,
  dog,
  fish,
  bird,
  rabbit,
  turtle,
  owl,
  fox,
  frog,
  bear,
  elephant,
]
