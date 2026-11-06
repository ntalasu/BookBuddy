// Real kids' books Buddy is allowed to recommend, grouped by what kids say they like.
// Small AI models make up book titles, so Buddy only recommends from this list
// (or the kid's own bookshelf). minAge = youngest age the book is a good fit for,
// so Buddy only suggests books that fit the kid. Add more books anytime!
type ListedBook = { title: string; minAge: number }

export const bookList: Record<string, ListedBook[]> = {
  Magic: [
    { title: "The Princess in Black by Shannon Hale and Dean Hale", minAge: 5 },
    { title: "Dinosaurs Before Dark (Magic Tree House) by Mary Pope Osborne", minAge: 6 },
    { title: "Dragons and Marshmallows (Zoey and Sassafras) by Asia Citro", minAge: 6 },
    { title: "Matilda by Roald Dahl", minAge: 8 },
    { title: "Harry Potter and the Sorcerer's Stone by J.K. Rowling", minAge: 9 },
  ],
  Animals: [
    { title: "The Very Hungry Caterpillar by Eric Carle", minAge: 4 },
    { title: "Pete the Cat: I Love My White Shoes by Eric Litwin", minAge: 4 },
    { title: "Mercy Watson to the Rescue by Kate DiCamillo", minAge: 5 },
    { title: "Henry and Mudge by Cynthia Rylant", minAge: 5 },
    { title: "Charlotte's Web by E.B. White", minAge: 7 },
    { title: "The Wild Robot by Peter Brown", minAge: 7 },
    { title: "Fantastic Mr. Fox by Roald Dahl", minAge: 7 },
    { title: "The Tale of Despereaux by Kate DiCamillo", minAge: 8 },
  ],
  Dragons: [
    { title: "Dragons Love Tacos by Adam Rubin", minAge: 4 },
    { title: "My Father's Dragon by Ruth Stiles Gannett", minAge: 6 },
    { title: "Rise of the Earth Dragon (Dragon Masters) by Tracey West", minAge: 6 },
    { title: "How to Train Your Dragon by Cressida Cowell", minAge: 8 },
    { title: "The Dragonet Prophecy (Wings of Fire) by Tui T. Sutherland", minAge: 9 },
  ],
  Funny: [
    { title: "We Are in a Book! (Elephant and Piggie) by Mo Willems", minAge: 4 },
    { title: "Dog Man by Dav Pilkey", minAge: 6 },
    { title: "James and the Giant Peach by Roald Dahl", minAge: 7 },
    { title: "Diary of a Wimpy Kid by Jeff Kinney", minAge: 8 },
    { title: "Frindle by Andrew Clements", minAge: 8 },
  ],
  Mystery: [
    { title: "Nate the Great by Marjorie Weinman Sharmat", minAge: 5 },
    { title: "Encyclopedia Brown, Boy Detective by Donald J. Sobol", minAge: 7 },
    { title: "Holes by Louis Sachar", minAge: 10 },
  ],
  Adventure: [
    { title: "Where the Wild Things Are by Maurice Sendak", minAge: 4 },
    { title: "Dinosaurs Before Dark (Magic Tree House) by Mary Pope Osborne", minAge: 6 },
    { title: "The Wild Robot by Peter Brown", minAge: 7 },
    { title: "The Phantom Tollbooth by Norton Juster", minAge: 9 },
    { title: "Percy Jackson and the Lightning Thief by Rick Riordan", minAge: 9 },
  ],
  Friendship: [
    { title: "Frog and Toad Are Friends by Arnold Lobel", minAge: 4 },
    { title: "Henry and Mudge by Cynthia Rylant", minAge: 5 },
    { title: "Charlotte's Web by E.B. White", minAge: 7 },
    { title: "Because of Winn-Dixie by Kate DiCamillo", minAge: 8 },
  ],
  "Science and Space": [
    { title: "Ada Twist, Scientist by Andrea Beaty", minAge: 4 },
    { title: "The Magic School Bus Lost in the Solar System by Joanna Cole", minAge: 5 },
  ],
}

// Just the "Title by Author" lines that fit this age
export function favoriteTitlesForAge(age: number) {
  return booksForAge(age).flatMap(([, titles]) => titles)
}

// The book list, with only the books that fit this age
export function booksForAge(age: number) {
  return Object.entries(bookList)
    .map(([topic, books]) => [topic, books.filter((book) => age >= book.minAge).map((book) => book.title)] as const)
    .filter(([, titles]) => titles.length > 0)
}
