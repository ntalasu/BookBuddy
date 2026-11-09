// The interests kids can pick on their profile, in three groups.
// Used by the profile page and by Buddy (to ask about them and find books).
export const interestGroups = [
  {
    title: "📚 Kinds of books I like",
    options: ["Adventure", "Mystery", "Funny", "Fantasy", "Magic", "Fairy Tales", "Spooky", "Superheroes", "Comics", "Poetry", "Jokes & Riddles"],
  },
  {
    title: "⭐ Things I'm into",
    options: ["Animals", "Pets", "Dinosaurs", "Bugs", "Ocean", "Nature", "Space", "Robots", "Science", "How Things Work", "History", "Real People", "Pirates", "Sports", "Art", "Music", "Cooking"],
  },
  {
    title: "🎉 Fun stuff",
    options: [
      "Friendship", "Family", "School", "Holidays", "Birthdays",
      "Video Games", "Toys", "Building Things", "Trucks & Cars", "Trains",
      "Knights & Castles", "Princesses", "Monsters", "Magic Tricks", "Camping", "Treats & Sweets",
    ],
  },
]

// A kid's picks, sorted into the three groups
export function groupInterests(interests: string[]) {
  const [kinds, things, fun] = interestGroups.map((group) => group.options.filter((option) => interests.includes(option)))
  return { kinds, things, fun }
}
