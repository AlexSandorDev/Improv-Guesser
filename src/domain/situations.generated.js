// AUTO-GENERATED FILE. DO NOT EDIT DIRECTLY.
// Edit src/domain/situations.md and run: npm run sync:situations

export const SITUATIONS = [
  {
    "id": "animal-shelter",
    "name": "Animal Shelter",
    "guesserPrompt": "What animal is taken home?",
    "acceptedAnswers": [
      "Cat",
      "Dog",
      "The Cat",
      "The Dog"
    ],
    "roles": [
      {
        "name": "Injured Dog",
        "mandatory": true,
        "prompt": "You are an injured dog. You cannot use words."
      },
      {
        "name": "Happy Cat",
        "mandatory": false,
        "prompt": "You are a happy cat. You cannot use words."
      },
      {
        "name": "Animal Caretaker",
        "mandatory": true,
        "prompt": "Take care of the animals and visitors. You have to help {Parent}, the parent, take home the pet they want by any means necessary."
      },
      {
        "name": "Child",
        "mandatory": true,
        "prompt": "You are 5 years old and really want to bring home a Cat."
      },
      {
        "name": "Parent",
        "mandatory": true,
        "prompt": "You came with your child, {Child} to choose a pet. You really want a dog because it leaves less fur."
      },
      {
        "name": "Grumpy Cat",
        "mandatory": false,
        "prompt": "You are a grumpy cat. You can't use words."
      }
    ]
  },
  {
    "id": "pirate-treasure",
    "name": "Pirate Treasure",
    "guesserPrompt": "Where does the ship end up going?",
    "acceptedAnswers": [
      "Island",
      "Treasure",
      "Out of the storm",
      "Shore",
      "Back to shore",
      "tresure island",
      "storm"
    ],
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
    ]
  },
  {
    "id": "bridal-boutique-showdown",
    "name": "Bridal Boutique Showdown",
    "guesserPrompt": "Which wedding gown gets chosen?",
    "acceptedAnswers": [
      "Mermaid",
      "Mermaid gown",
      "Mermaid dress",
      "The Mermaid",
      "Mermaid style",
      "Mermaid wedding dress"
    ],
    "roles": [
      {
        "name": "Bride",
        "mandatory": true,
        "prompt": "You want the daring Mermaid gown, but {Mother of the Bride} keeps pushing you toward something modest."
      },
      {
        "name": "Mother of the Bride",
        "mandatory": true,
        "prompt": "You're paying, and want {Bride} in the modest Ballgown, not the Mermaid. Say what the family will think."
      },
      {
        "name": "Seamstress",
        "mandatory": true,
        "prompt": "You fuss over {Mother of the Bride} and praise the Ballgown, but every pin quietly makes the Mermaid fit {Bride} better."
      },
      {
        "name": "Maid of Honor",
        "mandatory": false,
        "prompt": "You back {Bride} and hype the Mermaid, ignoring {Mother of the Bride}'s glares."
      },
      {
        "name": "Boutique Manager",
        "mandatory": false,
        "prompt": "You worry about the schedule and side with {Mother of the Bride}, since she signs the check."
      },
      {
        "name": "Flower Girl",
        "mandatory": false,
        "prompt": "You spin in circles and can't speak, just react to whichever dress looks prettiest."
      }
    ]
  },
  {
    "id": "kitchen-fire-order",
    "name": "Kitchen Rush",
    "guesserPrompt": "What dish leaves the kitchen first?",
    "acceptedAnswers": [
      "Wagyu Steak",
      "The Wagyu Steak",
      "Steak",
      "Wagyu",
      "The Steak"
    ],
    "roles": [
      {
        "name": "Head Chef",
        "mandatory": true,
        "prompt": "You run the line and want the Wagyu Steak plated first, no matter what {Sous Chef} says about ticket order."
      },
      {
        "name": "Sous Chef",
        "mandatory": true,
        "prompt": "You go by the ticket rail and insist the Lobster Risotto goes out first, blocking {Head Chef} from grabbing a plate early."
      },
      {
        "name": "Expediter",
        "mandatory": true,
        "prompt": "You call out orders and are supposed to be neutral, but you keep sending the Wagyu Steak to the pass, siding with {Head Chef}."
      },
      {
        "name": "Waiter",
        "mandatory": false,
        "prompt": "You keep asking if the Lobster Risotto is ready, pressuring {Sous Chef} to hurry it out."
      },
      {
        "name": "Dishwasher",
        "mandatory": false,
        "prompt": "You silently pile up dirty pans in the background, oblivious to the standoff."
      },
      {
        "name": "Food Critic",
        "mandatory": false,
        "prompt": "You're seated undercover, peeking toward the kitchen and making everyone nervous without saying why."
      }
    ]
  }
];
