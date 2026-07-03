# Situations

Edit each situation in the JSON blocks below.

Rules:
- Keep each situation as valid JSON inside `json` code fences.
- Keep `id` unique.

## Animal Shelter

```json
{
  "id": "animal-shelter",
  "name": "Animal Shelter",
  "guesserPrompt": "What animal is taken home?",
  "solutionPrompt": "Cat",
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
      "prompt": "Take care of the animals and visitors. You have to help the parent take home the pet they want by any means necessary.",
      "mandatory": true
    },
    {
      "name": "Child",
      "prompt": "You are 5 years old and really want to bring home a Cat.",
      "mandatory": true
    },
    {
      "name": "Parent",
      "prompt": "You came with your child to choose a pet. You really want a dog because it leaves less fur.",
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

## Vet Clinic

```json
{
  "id": "vet-clinic",
  "name": "Vet Clinic",
  "guesserPrompt": "[Player] _ an _ _ to the _ _.",
  "solutionPrompt": "{focusPlayer} brought an injured dog to a veterinary clinic.",
  "roles": [
    {
      "name": "Blue - Injured Dog",
      "mandatory": true,
      "prompt": "You are an injured dog. You cannot use words."
    },
    {
      "name": "Veterinarian",
      "mandatory": true,
      "prompt": "You are the veterinary doctor. Ask questions and examine the pets to discover what is wrong."
    },
    {
      "name": "Worried Dog Owner",
      "mandatory": true,
      "prompt": "You brought your dog because it has been limping all week."
    },
    {
      "name": "Whimsy cat",
      "mandatory": false,
      "prompt": "You are a whimsy cat. You constantly interrupt and mess with people. You are jealous of the attention the dog gets"
    },
    {
      "name": "Clumsy Assistant",
      "mandatory": false,
      "prompt": "Assist the veterinarian with tools and notes. You are friendly but a little clumsy."
    }
  ]
}
```

## Pirate Treasure

```json
{
  "id": "pirate-treasure",
  "name": "Pirate Treasure",
  "guesserPrompt": "Where does the ship end up going?",
  "solutionPrompt": "Island",
  "roles": [
    {
      "name": "Silent Helmsman",
      "mandatory": true,
      "prompt": "You man the steering wheel. You have to listen to your captain, but you want to get out of the storm and back to shore."
    },
    {
      "name": "Seasick Mate",
      "mandatory": false,
      "prompt": "You are a mate who is very seasick and keeps getting distracted by nausea, so you want to exit the storm and go back to shore as fast as possible."
    },
    {
      "name": "First Mate",
      "mandatory": true,
      "prompt": "You want to go back to shore so that the crew stays safe."
    },
    {
      "name": "Captain",
      "mandatory": true,
      "prompt": "You want to push trough the storm to get to the treasure on the island."
    },
    {
      "name": "Slimey Second Mate",
      "mandatory": false,
      "prompt": "You always agree with the Captain because you want to go up in rank."
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

## Sushi Restaurant

```json
{
  "id": "sushi-restaurant",
  "name": "Sushi Restaurant",
  "guesserPrompt": "_ at a _ _.",
  "solutionPrompt": "Date at a sushi restaurant.",
  "roles": [
    {
      "name": "Head Sushi Chef",
      "mandatory": false,
      "prompt": "You only speak Japanese. You are cooking in front of a couple."
    },
    {
      "name": "Date Guest",
      "mandatory": true,
      "prompt": "You are on a date with {focusPlayer}"
    },
    {
      "name": "Date Planner",
      "mandatory": true,
      "prompt": "You planned this anniversary dinner date and want everything to feel perfect."
    },
    {
      "name": "Waiter",
      "mandatory": true,
      "prompt": "You are a waiter at a sushi restaurant. You take the couples order."
    },
    {
      "name": "Dishwasher",
      "mandatory": false,
      "prompt": "You are overwhelmed with dishes and keep bumping into the kitchen staff."
    }
  ]
}
```
