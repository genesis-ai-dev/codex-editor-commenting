/**********************
 * Conversation Types *
 **********************/

/* Message is a single content string with metadata about the sender and identifiable anchors for the message (i.e., places where the message is relevant as linked by the sender). */
export type Message = {
    id: string;
    role: SenderRole;
    sender: Sender;
    content: string;
    links: Link[];
};

/* SenderRole is the role of the sender of a message. */
export enum SenderRole {
    USER,
    AI,
}

/* Sender is the sender of a message. */
export type Sender = {
    name: string;
    id: string;
};

/* Conversation is a list of messages and links to identifiable anchors for the conversation. */
export type Conversation = {
    id: string;
    messages: Message[];
    links: Link[];
};

/* Links connect a message of conversation to an identifier where a message is relevant. */
export type Link = {
    id: string;
    targetId?: string;
    // Theoretically, we could include commit hashes and uris/document positions here.
};

/***************
 * Codex Types *
 ***************/

/* Codex is a Jupyter-like notebook with a list of "code" cells (i.e., kind=2) and a list of "markdown" cells (i.e., kind=1). */

type Codex = {
    id: string;
    cells: Cell[];
};

/* Cell is a single cell in a Codex. */
type Cell = {
    id: string;
    kind: CellKind;
    content: string;
    links: Link[];
    metadata: CellMetadata;
};

/* CellKind is the type of cell. */
enum CellKind {
    MARKDOWN,
    CODE,
}

/* CellMetadata is the metadata for a cell. */
type CellMetadata = {
    vrefs: VRef[];
    notes: Note[];
    [key: string]: any;
};

/* Note is a single note. */
type Note = {
    id: string;
    content: string;
    links: Link[];
    createdAt: Date;
    updatedAt: Date;
};

/* VRef is a reference to an ORG Bible verse. */
type VRef = {
    book: string;
    chapter: number;
    verse: number;
};

/* Dictionary is an extensible JSON dictionary of words and their definitions, plus additional metadata. */
type Dictionary = {
    id: string;
    label: string;
    entries: DictionaryEntry[];
    metadata: DictionaryMetadata;
};

/* DictionaryMetadata is the metadata for a dictionary. */
type DictionaryMetadata = {
    [key: string]: any;
};

/* DictionaryEntry is a single entry in a dictionary. */
type DictionaryEntry = {
    id: string;
    headForm: string; // This can be auto-populated as a quick action in the editor
    /* 
    Users can merge entries with the same or similar head forms
    by adding the entry ids to the linkedEntries array.

    This array of variants functions like a list of linked entries, but all the variants have their own entries.
    */
    variantForms: string[] | DictionaryEntry[]; // FIXME: we could use the headword string... or we could use the entry id... or we could use the entry itself...
    definition: string;
    translationEquivalents: string[];
    links: Link[];
    linkedEntries: string[];
    metadata: DictionaryEntryMetadata;
    notes: Note[];
};

/* DictionaryEntryMetadata is the metadata for a dictionary entry. */
type DictionaryEntryMetadata = {
    [key: string]: any;
};