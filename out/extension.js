'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = void 0;
const vscode = require("vscode");
const util_1 = require("util");
const util_2 = require("util");
let commentId = 1;
let commentThreads = [];
class NoteComment {
    constructor(body, mode, author, parent, contextValue) {
        this.body = body;
        this.mode = mode;
        this.author = author;
        this.parent = parent;
        this.contextValue = contextValue;
        this.id = ++commentId;
        this.savedBody = this.body;
    }
    toJSON() {
        return {
            id: this.id,
            label: this.label,
            body: this.body instanceof vscode.MarkdownString ? this.body.value : this.body,
            mode: this.mode,
            author: this.author,
            contextValue: this.contextValue
        };
    }
}
class FileHandler {
    async writeFile(filename, data) {
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders) {
            throw new Error('No workspace folders found.');
        }
        const uri = vscode.Uri.joinPath(workspaceFolders[0].uri, filename);
        console.log(`Attempting to write file: ${uri.fsPath}`); // Log the file path
        const uint8Array = new util_1.TextEncoder().encode(data);
        try {
            await vscode.workspace.fs.writeFile(uri, uint8Array);
            console.log('File written successfully:', uri.fsPath);
        }
        catch (error) {
            console.error('Error writing file:', error, `Path: ${uri.fsPath}`);
        }
    }
    async readFile(filename) {
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders) {
            throw new Error('No workspace folders found.');
        }
        const uri = vscode.Uri.joinPath(workspaceFolders[0].uri, filename);
        try {
            const uint8Array = await vscode.workspace.fs.readFile(uri);
            return new util_2.TextDecoder().decode(uint8Array);
        }
        catch (error) {
            console.error('Error reading file:', error, `Path: ${uri.fsPath}`);
            throw error; // Rethrow the error to handle it in the calling code
        }
    }
}
function activate(context) {
    // A `CommentController` is able to provide comments for documents.
    const commentController = vscode.comments.createCommentController('comment-sample', 'Comment API Sample');
    context.subscriptions.push(commentController);
    // A `CommentingRangeProvider` controls where gutter decorations that allow adding comments are shown
    commentController.commentingRangeProvider = {
        provideCommentingRanges: (document, token) => {
            const lineCount = document.lineCount;
            return [new vscode.Range(0, 0, lineCount - 1, 0)];
        }
    };
    const fileHandler = new FileHandler();
    fileHandler.readFile('comments.json')
        .then(jsonData => {
        // Now jsonData contains the contents of the file
        console.log('Read operation completed.', jsonData);
        restoreCommentsFromJSON(jsonData, commentController); // Call the function here
    })
        .catch(error => console.error(error));
    async function writeSerializedData(serializedData, filename = 'comments.json') {
        const fileHandler = new FileHandler();
        try {
            await fileHandler.writeFile(filename, serializedData);
            console.log('Write operation completed.');
        }
        catch (error) {
            console.error('Error writing file:', error);
        }
    }
    vscode.workspace.onDidSaveTextDocument(async (document) => {
        const serializedData = serializeCommentThreads(commentThreads); // Assuming serializeCommentThreads is available in this scope
        await writeSerializedData(serializedData, 'comments.json');
    });
    context.subscriptions.push(vscode.commands.registerCommand('mywiki.createNote', (reply) => {
        const newThread = replyNote(reply);
        if (newThread) {
            commentThreads = [...commentThreads, newThread];
            // console.log({ commentThreads });
        }
    }));
    context.subscriptions.push(vscode.commands.registerCommand('mywiki.replyNote', (reply) => {
        replyNote(reply);
    }));
    context.subscriptions.push(vscode.commands.registerCommand('mywiki.startDraft', (reply) => {
        const thread = reply.thread;
        thread.contextValue = 'draft';
        const newComment = new NoteComment(reply.text, vscode.CommentMode.Preview, { name: 'vscode' }, thread);
        newComment.label = 'pending';
        thread.comments = [...thread.comments, newComment];
    }));
    context.subscriptions.push(vscode.commands.registerCommand('mywiki.finishDraft', (reply) => {
        const thread = reply.thread;
        if (!thread) {
            return;
        }
        thread.contextValue = undefined;
        thread.collapsibleState = vscode.CommentThreadCollapsibleState.Collapsed;
        if (reply.text) {
            const newComment = new NoteComment(reply.text, vscode.CommentMode.Preview, { name: 'vscode' }, thread);
            thread.comments = [...thread.comments, newComment].map(comment => {
                comment.label = undefined;
                return comment;
            });
        }
    }));
    context.subscriptions.push(vscode.commands.registerCommand('mywiki.deleteNoteComment', (comment) => {
        const thread = comment.parent;
        if (!thread) {
            return;
        }
        thread.comments = thread.comments.filter(cmt => cmt.id !== comment.id);
        if (thread.comments.length === 0) {
            thread.dispose();
        }
    }));
    context.subscriptions.push(vscode.commands.registerCommand('mywiki.deleteNote', (thread) => {
        thread.dispose();
        removeThread(thread);
    }));
    context.subscriptions.push(vscode.commands.registerCommand('mywiki.cancelsaveNote', (comment) => {
        if (!comment.parent) {
            return;
        }
        comment.parent.comments = comment.parent.comments.map(cmt => {
            if (cmt.id === comment.id) {
                cmt.body = cmt.savedBody;
                cmt.mode = vscode.CommentMode.Preview;
            }
            return cmt;
        });
    }));
    context.subscriptions.push(vscode.commands.registerCommand('mywiki.saveNote', (comment) => {
        if (!comment.parent) {
            return;
        }
        comment.parent.comments = comment.parent.comments.map(cmt => {
            if (cmt.id === comment.id) {
                cmt.savedBody = cmt.body;
                cmt.mode = vscode.CommentMode.Preview;
            }
            return cmt;
        });
    }));
    context.subscriptions.push(vscode.commands.registerCommand('mywiki.editNote', (comment) => {
        if (!comment.parent) {
            return;
        }
        comment.parent.comments = comment.parent.comments.map(cmt => {
            if (cmt.id === comment.id) {
                cmt.mode = vscode.CommentMode.Editing;
            }
            return cmt;
        });
    }));
    context.subscriptions.push(vscode.commands.registerCommand('mywiki.dispose', () => {
        commentController.dispose();
    }));
    context.subscriptions.push(new vscode.Disposable(() => {
        const serializedData = serializeCommentThreads(commentThreads);
        console.log(serializedData);
        commentThreads.forEach(thread => thread.dispose());
        commentThreads = [];
    }));
    function replyNote(reply) {
        const thread = reply.thread;
        const newComment = new NoteComment(reply.text, vscode.CommentMode.Preview, { name: 'vscode' }, thread, thread.comments.length ? 'canDelete' : undefined);
        if (thread.contextValue === 'draft') {
            newComment.label = 'pending';
        }
        thread.comments = [...thread.comments, newComment];
        return thread;
    }
    function removeThread(thread) {
        const index = commentThreads.indexOf(thread);
        if (index > -1) {
            commentThreads.splice(index, 1);
        }
    }
    function serializeCommentThread(thread) {
        return {
            uri: thread.uri.toString(),
            range: {
                start: { line: thread.range.start.line, character: thread.range.start.character },
                end: { line: thread.range.end.line, character: thread.range.end.character }
            },
            comments: thread.comments.map(comment => comment.toJSON()),
            // collapsibleState: thread.collapsibleState
            collapsibleState: vscode.CommentThreadCollapsibleState.Collapsed
        };
    }
    function serializeCommentThreads(threads) {
        const serializedThreads = threads.map(serializeCommentThread);
        return JSON.stringify(serializedThreads, null, 2); // Pretty print JSON
    }
    async function restoreCommentsFromJSON(jsonData, commentController) {
        const threadsData = JSON.parse(jsonData);
        for (const threadData of threadsData) {
            // Recreate the URI and Range for the CommentThread
            const uri = vscode.Uri.parse(threadData.uri);
            const range = new vscode.Range(new vscode.Position(threadData.range.start.line, threadData.range.start.character), new vscode.Position(threadData.range.end.line, threadData.range.end.character));
            // Create the CommentThread
            const thread = commentController.createCommentThread(uri, range, []);
            // Add the thread to the commentThreads array
            commentThreads.push(thread);
            // Recreate and add NoteComments to the CommentThread
            for (const commentData of threadData.comments) {
                const comment = new NoteComment(commentData.body, commentData.mode, commentData.author, thread, commentData.contextValue);
                thread.comments = [...thread.comments, comment];
            }
            // Set the collapsible state
            // thread.collapsibleState = threadData.collapsibleState;
            thread.collapsibleState = vscode.CommentThreadCollapsibleState.Collapsed;
        }
    }
}
exports.activate = activate;
//# sourceMappingURL=extension.js.map