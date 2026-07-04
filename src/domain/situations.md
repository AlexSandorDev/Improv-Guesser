# Situations

Edit each situation in the JSON blocks below.

Rules:
- Keep each situation as valid JSON inside `json` code fences.
- Keep `id` unique.

Designing a new situation? See [docs/situation-design-guide.md](../../docs/situation-design-guide.md)
for the thought process behind these (opposition, role relationships, guessable end goal) before
writing one.

## Animal Shelter

```json
{
  "id": "animal-shelter",
  "name": "Animal Shelter",
  "guesserPrompt": "What animal is taken home?",
  "roles": [
    {
      "name": "Injured Dog",
      "prompt": "You are an injured dog. You cannot use words.",
      "mandatory": true
    },
    {
      "name": "Happy Cat",
      "prompt": "You are a happy cat. You cannot use words.",
      "mandatory": false
    },
    {
      "name": "Animal Caretaker",
      "prompt": "Take care of the animals and visitors. You have to help {Parent}, the parent, take home the pet they want by any means necessary.",
      "mandatory": true
    },
    {
      "name": "Child",
      "prompt": "You are 5 years old and really want to bring home a Cat.",
      "mandatory": true
    },
    {
      "name": "Parent",
      "prompt": "You came with your child, {Child} to choose a pet. You really want a dog because it leaves less fur.",
      "mandatory": true
    },
    {
      "name": "Grumpy Cat",
      "prompt": "You are a grumpy cat. You can't use words.",
      "mandatory": false
    }
  ],
  "acceptedAnswers": [
    "Cat",
    "Dog",
    "The Cat",
    "The Dog"
  ]
}
```

## Pirate Treasure

```json
{
  "id": "pirate-treasure",
  "name": "Pirate Treasure",
  "guesserPrompt": "Where does the ship end up going?",
  "roles": [
    {
      "name": "Helmsman",
      "mandatory": false,
      "prompt": "You man the steering wheel. You have to listen to your captain, {Captain}, but you want to get out of the storm and back to shore."
    },
    {
      "name": "Seasick Mate",
      "mandatory": false,
      "prompt": "You are a mate who is very seasick and keeps getting distracted by nausea, so you want to exit the storm and go back to shore as fast as possible."
    },
    {
      "name": "First Mate",
      "mandatory": true,
      "prompt": "You want to go back to shore so that the crew stays safe. {Captain} is the captain."
    },
    {
      "name": "Captain",
      "mandatory": true,
      "prompt": "You want to push trough the storm to get to the treasure on the island. {First Mate} is the first mate."
    },
    {
      "name": "Slimey Second Mate",
      "mandatory": false,
      "prompt": "You always agree with {Captain}, the Captain, because you want to go up in rank."
    }
  ],
  "acceptedAnswers": [
    "Island",
    "Treasure",
    "Out of the storm",
    "Shore",
    "Back to shore",
    "tresure island",
    "storm"
  ]
}
```

## Bridal Boutique Showdown

```json
{
  "id": "bridal-boutique-showdown",
  "name": "Bridal Boutique Showdown",
  "guesserPrompt": "Which wedding gown gets chosen?",
  "roles": [
    {
      "name": "Bride",
      "prompt": "You want the daring Mermaid gown, but {Mother of the Bride} keeps pushing you toward something modest.",
      "mandatory": true
    },
    {
      "name": "Mother of the Bride",
      "prompt": "You're paying, and want {Bride} in the modest Ballgown, not the Mermaid. Say what the family will think.",
      "mandatory": true
    },
    {
      "name": "Seamstress",
      "prompt": "You fuss over {Mother of the Bride} and praise the Ballgown, but every pin quietly makes the Mermaid fit {Bride} better.",
      "mandatory": true
    },
    {
      "name": "Maid of Honor",
      "prompt": "You back {Bride} and hype the Mermaid, ignoring {Mother of the Bride}'s glares.",
      "mandatory": false
    },
    {
      "name": "Boutique Manager",
      "prompt": "You worry about the schedule and side with {Mother of the Bride}, since she signs the check.",
      "mandatory": false
    },
    {
      "name": "Flower Girl",
      "prompt": "You spin in circles and can't speak, just react to whichever dress looks prettiest.",
      "mandatory": false
    }
  ],
  "acceptedAnswers": [
    "Mermaid",
    "Mermaid gown",
    "Mermaid dress",
    "The Mermaid",
    "Mermaid style",
    "Mermaid wedding dress"
  ]
}
```

## Kitchen Rush

```json
{
  "id": "kitchen-fire-order",
  "name": "Kitchen Rush",
  "guesserPrompt": "What dish leaves the kitchen first?",
  "roles": [
    {
      "name": "Head Chef",
      "prompt": "You run the line and want the Wagyu Steak plated first, no matter what {Sous Chef} says about ticket order.",
      "mandatory": true
    },
    {
      "name": "Sous Chef",
      "prompt": "You go by the ticket rail and insist the Lobster Risotto goes out first, blocking {Head Chef} from grabbing a plate early.",
      "mandatory": true
    },
    {
      "name": "Expediter",
      "prompt": "You call out orders and are supposed to be neutral, but you keep sending the Wagyu Steak to the pass, siding with {Head Chef}.",
      "mandatory": true
    },
    {
      "name": "Waiter",
      "prompt": "You keep asking if the Lobster Risotto is ready, pressuring {Sous Chef} to hurry it out.",
      "mandatory": false
    },
    {
      "name": "Dishwasher",
      "prompt": "You silently pile up dirty pans in the background, oblivious to the standoff.",
      "mandatory": false
    },
    {
      "name": "Food Critic",
      "prompt": "You're seated undercover, peeking toward the kitchen and making everyone nervous without saying why.",
      "mandatory": false
    }
  ],
  "acceptedAnswers": [
    "Wagyu Steak",
    "The Wagyu Steak",
    "Steak",
    "Wagyu",
    "The Steak"
  ]
}
```
