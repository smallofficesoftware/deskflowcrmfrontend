import React, { useState, useEffect, useRef } from "react";
import { EditorState } from "draft-js";
import { stateToHTML } from "draft-js-export-html";
import { stateFromHTML } from "draft-js-import-html";
import { Editor } from "react-draft-wysiwyg";
import "react-draft-wysiwyg/dist/react-draft-wysiwyg.css";

interface IEmailCustomEditorProps {
  text1: string;
  setMessage: (message: string) => void;
}

const createEditorState = (text: string): EditorState => {
  const contentState = stateFromHTML(text);
  return EditorState.createWithContent(contentState);
};

const EmailCustomEditor: React.FC<IEmailCustomEditorProps> = ({
    text1,
  setMessage,
}) => {
  const [editorState, setEditorState] = useState(EditorState.createEmpty());


  const onEditorStateChange = (editorState: EditorState) => {
    setEditorState(editorState);
    const html = stateToHTML(editorState.getCurrentContent());
    // Update the message state with the HTML content
    setMessage(html);
  };

  const handleFileChange1 = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file1 = event.target.files && event.target.files[0];
  };

  return (
    <div className="w-100 h-100 border" >
      <Editor
        editorState={editorState}
        toolbar={{
          options: ["inline", "list"],
        }}
        onEditorStateChange={onEditorStateChange}
      />
    </div>
  );
};

export default EmailCustomEditor;
