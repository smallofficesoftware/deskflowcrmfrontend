import { Designer } from "@pdfme/ui";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { SelectedField } from "./useDesignerInstance";

// pdfme's own page-thumbnail menu ships "Add Page After" only (no "before"
// key in its i18n dictionary) and isn't extensible from outside (pageCursor
// — which page is "current" — is that component's own internal state,
// never exposed by Designer's public API). An earlier version of this
// guessed "current page" from the last-selected field's pageIndex — wrong
// the moment you're just scrolled/viewing a different page without having
// clicked a field on it (confirmed bug report: "i am in the second page
// but remove page always last page"). Tracking an explicit, visible page
// number instead — defaulting to whatever field was last selected, but
// always overridable — removes the ambiguity entirely.
export function usePageManipulation(
  designerRef: React.RefObject<Designer | null>,
  selectedField: SelectedField | null,
  askConfirm: (message: string, onConfirm: () => void) => void,
  guard?: () => boolean,
) {
  const [targetPageNumber, setTargetPageNumber] = useState(1);

  useEffect(() => {
    if (selectedField) setTargetPageNumber(selectedField.pageIndex + 1);
  }, [selectedField]);

  const canProceed = () => (!guard || guard()) && !!designerRef.current;

  const addPageBefore = () => {
    if (!canProceed() || !designerRef.current) return;
    const template = designerRef.current.getTemplate();
    const insertAt = Math.min(Math.max(targetPageNumber - 1, 0), template.schemas.length);
    const schemas = [...template.schemas];
    schemas.splice(insertAt, 0, []);
    designerRef.current.updateTemplate({ ...template, schemas });
    setTargetPageNumber(insertAt + 1);
  };

  const addPageAfter = () => {
    if (!canProceed() || !designerRef.current) return;
    const template = designerRef.current.getTemplate();
    const insertAt = Math.min(Math.max(targetPageNumber, 0), template.schemas.length);
    const schemas = [...template.schemas];
    schemas.splice(insertAt, 0, []);
    designerRef.current.updateTemplate({ ...template, schemas });
    setTargetPageNumber(insertAt + 1);
  };

  const removeCurrentPage = () => {
    if (!canProceed() || !designerRef.current) return;
    const template = designerRef.current.getTemplate();
    if (template.schemas.length <= 1) {
      toast.error("Can't remove the only page");
      return;
    }
    const removeAt = Math.min(Math.max(targetPageNumber - 1, 0), template.schemas.length - 1);
    askConfirm(`Remove page ${removeAt + 1}? Any fields on it will be deleted.`, () => {
      const schemas = [...template.schemas];
      schemas.splice(removeAt, 1);
      designerRef.current?.updateTemplate({ ...template, schemas });
      setTargetPageNumber(Math.max(1, removeAt));
    });
  };

  return { targetPageNumber, setTargetPageNumber, addPageBefore, addPageAfter, removeCurrentPage };
}
