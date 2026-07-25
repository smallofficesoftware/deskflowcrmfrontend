import React, { useState, useEffect, useRef } from "react";
import {
  EditorState,
  RichUtils,
  DraftHandleValue,
  Modifier,
  ContentState,
  convertFromHTML,
} from "draft-js";
import { stateToHTML } from "draft-js-export-html";
import { stateFromHTML } from "draft-js-import-html";
import "react-draft-wysiwyg/dist/react-draft-wysiwyg.css";
import { Editor } from "react-draft-wysiwyg";
import { toast } from "react-toastify";


interface INoteEditorProps {
  fieldName: string;
  onSend: (fieldName: string, html: string) => void;
  editMsg: string;
  emptyTextArea: boolean;
  setemptyTextArea: (val: boolean) => void;
  setInitialContent: any,
  setNoteInputInput: any
}
const NoteEditor: React.FC<INoteEditorProps> = ({
  fieldName,
  onSend,
  editMsg,
  emptyTextArea,
  setemptyTextArea,
  setInitialContent,
  setNoteInputInput
}) => {
  const [editorState, setEditorState] = useState(EditorState.createEmpty());

  useEffect(() => {
    if (emptyTextArea) {
      setEditorState(EditorState.createEmpty());
      setemptyTextArea(false);
    }
  }, [emptyTextArea]);

  useEffect(() => {
    if (editMsg) {
      const blocksFromHTML = convertFromHTML(editMsg);
      const contentState = ContentState.createFromBlockArray(
        blocksFromHTML.contentBlocks,
        blocksFromHTML.entityMap
      );
      setEditorState(EditorState.createWithContent(contentState));
      const htmlContent = stateToHTML(contentState);

      setInitialContent(htmlContent);
      setNoteInputInput(htmlContent); // Ensure noteInput gets updated

    } else {

      setEditorState(EditorState.createEmpty());
      setInitialContent("");
      setNoteInputInput("");
    }

  }, [editMsg]);

  const createEditorState = (text: string): EditorState => {
    const contentState = stateFromHTML(text);
    return EditorState.createWithContent(contentState);
  };

  const handleReturn = (event: React.KeyboardEvent): boolean => {
    if (event.shiftKey) {
      return false;
    }
    return true;
  };
  const wrapperRef = useRef<HTMLDivElement>(null);
  const onEditorStateChange = (editorState: EditorState) => {
    setEditorState(editorState);
    const html = stateToHTML(editorState.getCurrentContent());

    if (html === "<p><br></p>") {
      // toast.error("Please enter a notes.");
      return;
    }

    if (html.length < 8 || html.length > 1000) {
      toast.error("Note length should be between 1 and 1000 characters.");
      return;
    }
    onSend(fieldName, html);
  };


  return (
    <div className="border col-12" ref={wrapperRef}>
      <Editor
        editorState={editorState}
        toolbar={{
          options: ["inline", "list"],
          inline: {
            options: ["bold", "italic", "underline", "strikethrough"],
          },
          list: {
            options: ["unordered", "ordered", "colorPicker"],
          },
          textAlign: {
            options: ["left", "center", "right", "justify"],
          },
        }}
        onEditorStateChange={onEditorStateChange}
      />
    </div>
  );
};

export default NoteEditor;
