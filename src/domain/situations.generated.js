// AUTO-GENERATED FILE. DO NOT EDIT DIRECTLY.
// Edit src/domain/situations.md and run: npm run sync:situations

export const SITUATIONS = [
  {
    "id": "animal-shelter",
    "name": "Animal Shelter",
    "guesserPrompt": "[Player] _ a _ from the _ _.",
    "solutionPrompt": "{focusPlayer} adopts a dog from the animal shelter.",
    "clueChecklist": [
      "adopting a pet",
      "animal shelter setting",
      "child and parent choosing a dog"
    ],
    "roles": [
      {
        "name": "Blue - Injured Dog",
        "mandatory": true,
        "prompt": "You are an injured dog. You can mime, bark, and make other sounds, but you cannot talk with words."
      },
      {
        "name": "Green - Happy Cat",
        "mandatory": false,
        "prompt": "You are a happy cat. You can mime and make cat sounds, but you cannot talk with words."
      },
      {
        "name": "Yellow - Animal Caretaker",
        "mandatory": false,
        "prompt": "Take care of the animals and visitors. Keep everyone calm and organized."
      },
      {
        "name": "Purple - Excited Child",
        "mandatory": true,
        "prompt": "You are 5 years old and want to bring home an animal with your parent. You will choose the dog. Do not say: adopt, shelter."
      },
      {
        "name": "Red - Parent",
        "mandatory": true,
        "prompt": "You came with your child to choose a pet. You prefer a dog because it leaves less fur around the house."
      },
      {
        "name": "Orange - Reception Volunteer",
        "mandatory": false,
        "prompt": "You welcome people at the front desk and ask each visitor what they are looking for."
      }
    ]
  },
  {
    "id": "vet-clinic",
    "name": "Vet Clinic",
    "guesserPrompt": "[Player] _ an _ _ to the _ _.",
    "solutionPrompt": "{focusPlayer} brought an injured dog to a veterinary clinic.",
    "clueChecklist": [
      "injured dog visit",
      "veterinary exam and treatment",
      "owner discussing symptoms"
    ],
    "roles": [
      {
        "name": "Blue - Injured Dog",
        "mandatory": true,
        "prompt": "You are an injured dog. You can bark and mime pain, but you cannot talk with words."
      },
      {
        "name": "Yellow - Veterinarian",
        "mandatory": true,
        "prompt": "You are the veterinary doctor. Ask questions and examine the pets to discover what is wrong."
      },
      {
        "name": "Purple - Worried Dog Owner",
        "mandatory": true,
        "prompt": "You brought your dog because it has been limping all week."
      },
      {
        "name": "Red - Receptionist",
        "mandatory": false,
        "prompt": "You are a whimsy cat. You constantly interrupt and mess with people. You are jealous of the attention the dog gets"
      },
      {
        "name": "Orange - Vet Assistant",
        "mandatory": false,
        "prompt": "Assist the veterinarian with tools and notes. You are friendly but a little clumsy."
      }
    ]
  },
  {
    "id": "pirate-treasure",
    "name": "Pirate Treasure",
    "guesserPrompt": "_ to _ [Player] _ _ ",
    "solutionPrompt": "Navigating to Captain {focusPlayer}'s treasure island.",
    "clueChecklist": [
      "pirate crew dynamics",
      "searching for hidden treasure",
      "navigation toward an island"
    ],
    "roles": [
      {
        "name": "Treasure Captain",
        "mandatory": true,
        "prompt": "You are Captain {player}. Draw directions to your treasure island. You can't talk, because you are dead."
      },
      {
        "name": "Silent Helmsman",
        "mandatory": false,
        "prompt": "You man the steering wheel. You cannot talk."
      },
      {
        "name": "Seasick Mate",
        "mandatory": true,
        "prompt": "You are a mate who is very seasick and keeps getting distracted by nausea."
      },
      {
        "name": "Strict First Mate",
        "mandatory": false,
        "prompt": "You are trying to keep discipline on deck and get everyone focused on finding treasure."
      },
      {
        "name": "Captain",
        "mandatory": true,
        "prompt": "You are the Captain, obsessed with finding the treasure quickly. You have to keep order on deck."
      }
    ]
  },
  {
    "id": "stormy-night",
    "name": "Stormy Night At Sea",
    "guesserPrompt": "[Player] _ to _ _ through a _ _ _ night.",
    "solutionPrompt": "{focusPlayer} is trying to get home through a stormy night at sea.",
    "clueChecklist": [
      "storm navigation",
      "crew panic and commands",
      "searching for shore"
    ],
    "roles": [
      {
        "name": "Helmsman",
        "mandatory": true,
        "prompt": "You man the steering and try to keep the ship steady against big waves."
      },
      {
        "name": "Seasick Mate",
        "mandatory": true,
        "prompt": "You are very seasick and can barely help, but still try to follow orders."
      },
      {
        "name": "Captain",
        "mandatory": true,
        "prompt": "You are the captain and must keep the crew on course while everyone panics."
      },
      {
        "name": "Navigator",
        "mandatory": false,
        "prompt": "You are trying to find shore in near-darkness using unreliable tools."
      },
      {
        "name": "Overboard Sailor",
        "mandatory": false,
        "prompt": "You fell overboard and are trying to get back onto the ship without being left behind."
      },
      {
        "name": "Deckhand",
        "mandatory": false,
        "prompt": "You are securing ropes and cargo while shouting updates about the storm."
      }
    ]
  },
  {
    "id": "sushi-restaurant",
    "name": "Sushi Restaurant",
    "guesserPrompt": " _ at a _ _.",
    "solutionPrompt": "Date at a sushi restaurant.",
    "clueChecklist": [
      "restaurant service interactions",
      "sushi preparation in the kitchen",
      "anniversary date atmosphere"
    ],
    "roles": [
      {
        "name": "Sushi Cook",
        "mandatory": false,
        "prompt": "You are trying to cook sushi quickly. You cannot use your normal language and should fake Japanese sounds."
      },
      {
        "name": "Head Chef",
        "mandatory": false,
        "prompt": "You are the head chef and keep criticizing the cooks. You only speak in fake Japanese sounds."
      },
      {
        "name": "Date Guest",
        "mandatory": true,
        "prompt": "You are on an anniversary date and are excited because you love sushi. You've never been here before so you ask the waiter for recommendations."
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
];
