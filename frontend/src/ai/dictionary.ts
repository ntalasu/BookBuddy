// Real word meanings from the Free Dictionary API (https://dictionaryapi.dev/, free, no key).
// Buddy only rewords these for kids, so it can't make up what a word means.
// Only the single word is sent (a word from Buddy's own reply), never anything the kid typed.

type DictionaryEntry = {
  meanings: { partOfSpeech: string; definitions: { definition: string }[] }[]
}

// Up to 3 meanings, like "(noun) A remarkable occurrence; a striking event."
export async function dictionaryMeanings(word: string): Promise<string[]> {
  try {
    const response = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`)
    if (!response.ok) return [] // 404 = the dictionary doesn't know the word
    const entries: DictionaryEntry[] = await response.json()
    return entries
      .flatMap((entry) => entry.meanings)
      .map((meaning) => ({ partOfSpeech: meaning.partOfSpeech, definition: meaning.definitions[0]?.definition }))
      .filter((meaning) => meaning.definition)
      .slice(0, 3)
      .map((meaning) => `(${meaning.partOfSpeech}) ${meaning.definition}`)
  } catch {
    return []
  }
}

// The dictionary's main meaning, shortened, for when Buddy's kid version doesn't match:
// "(noun) A remarkable occurrence; a striking event." -> "A remarkable occurrence."
export function mainMeaning(meanings: string[]) {
  const main = meanings[0].replace(/^\(\w+\)\s*/, "").split(/[;:]/)[0].trim().replace(/\.$/, "")
  return `${main.charAt(0).toUpperCase()}${main.slice(1)}.`
}
