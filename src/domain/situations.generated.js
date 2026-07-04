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
    "id": "animal-shelter-reversed",
    "name": "Animal Shelter Reversed",
    "guesserPrompt": "What animal is taken home?",
    "acceptedAnswers": [
      "Dog",
      "Cat",
      "The Dog",
      "The Cat"
    ],
    "roles": [
      {
        "name": "Injured Cat",
        "mandatory": true,
        "prompt": "You are an injured cat. You cannot use words."
      },
      {
        "name": "Happy Dog",
        "mandatory": false,
        "prompt": "You are a happy dog. You cannot use words."
      },
      {
        "name": "Animal Caretaker",
        "mandatory": true,
        "prompt": "Take care of the animals and visitors. You have to help {Parent}, the parent, take home the pet they want by any means necessary."
      },
      {
        "name": "Child",
        "mandatory": true,
        "prompt": "You are 5 years old and really want to bring home a Dog."
      },
      {
        "name": "Parent",
        "mandatory": true,
        "prompt": "You came with your child, {Child} to choose a pet. You really want a cat because it doesn't bark."
      },
      {
        "name": "Grumpy Dog",
        "mandatory": false,
        "prompt": "You are a grumpy dog. You can't use words."
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
        "prompt": "You are a mate who is very seasick, so you want to exit the storm and go back to shore as fast as possible."
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
    "id": "pirate-treasure-reversed",
    "name": "Pirate Treasure Reversed",
    "guesserPrompt": "Where does the ship end up going?",
    "acceptedAnswers": [
      "Shore",
      "Back to shore",
      "Out of the storm",
      "Island",
      "Treasure",
      "tresure island",
      "storm"
    ],
    "roles": [
      {
        "name": "Helmsman",
        "mandatory": false,
        "prompt": "You man the steering wheel. You have to listen to your captain, {Captain}, but you want to get the treasure to help your starving family."
      },
      {
        "name": "Seasick Mate",
        "mandatory": false,
        "prompt": "You are a mate who is very seasick, so you want to exit the storm and go back to shore as fast as possible."
      },
      {
        "name": "First Mate",
        "mandatory": true,
        "prompt": "You want to push trough the storm to get to the treasure on the island. {Captain} is the captain."
      },
      {
        "name": "Captain",
        "mandatory": true,
        "prompt": "You want to go back to shore so that the crew stays safe. {First Mate} is the first mate."
      },
      {
        "name": "Slimey Second Mate",
        "mandatory": false,
        "prompt": "You always agree with {Captain}, the Captain, because you want to go up in rank."
      }
    ]
  },
  {
    "id": "sushi-restaurant-complaint",
    "name": "Sushi Restaurant Complaint",
    "guesserPrompt": "What do the customers get?",
    "acceptedAnswers": [
      "Refund",
      "A refund",
      "Full refund",
      "Their money back",
      "Money back"
    ],
    "roles": [
      {
        "name": "Furious Customer",
        "mandatory": true,
        "prompt": "You hate tonight's sushi and demand a refund from {Waiter}."
      },
      {
        "name": "Waiter",
        "mandatory": true,
        "prompt": "You insist the sushi is fine and refuse {Furious Customer} a refund since it comes out of your tips. You have to translate for {Sushi Chef}, since he only knows japanesse."
      },
      {
        "name": "Spouse",
        "mandatory": false,
        "prompt": "You are the spouse of {Furious Customer}. The fish tastes off and you insist on getting your money back."
      },
      {
        "name": "Sushi Chef",
        "mandatory": true,
        "prompt": "You only speak Japanese. {Waiter} has to translate for you."
      }
    ]
  },
  {
    "id": "knights-tournament-for-love",
    "name": "Knights Tournament for Love",
    "guesserPrompt": "Which knight wins the princess?",
    "acceptedAnswers": [
      "{First Knight}"
    ],
    "roles": [
      {
        "name": "First Knight",
        "mandatory": true,
        "prompt": "You're in love with {Courted Princess} and want her to choose you over {Second Knight}."
      },
      {
        "name": "Second Knight",
        "mandatory": true,
        "prompt": "You want {Courted Princess} to choose you, not {First Knight}."
      },
      {
        "name": "Courted Princess",
        "mandatory": true,
        "prompt": "Both {First Knight} and {Second Knight} are courting you, but you're secretly drawn to {First Knight}."
      },
      {
        "name": "Jealous Sister",
        "mandatory": true,
        "prompt": "You're jealous of {Courted Princess}'s attention. Your family wants you to back {Second Knight}, but you're drawn to {First Knight} yourself."
      },
      {
        "name": "King",
        "mandatory": false,
        "prompt": "You want {Courted Princess} to marry {Second Knight} for the alliance it would bring."
      },
      {
        "name": "Squire",
        "mandatory": false,
        "prompt": "You're loyal to {First Knight} and want to see him win {Courted Princess}'s hand."
      }
    ]
  }
];
