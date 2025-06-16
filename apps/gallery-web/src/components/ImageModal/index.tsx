import { ImageModal as ImageModalView } from "./ImageModal";
import type { ImageModalViewProps } from "./ImageModal";
import { useImageModal } from "./useImageModal";
import type { ImageModalProps } from "./useImageModal";

export default function ImageModal(props: ImageModalProps) {
  const modalProps = useImageModal(props);
  return <ImageModalView {...(modalProps as ImageModalViewProps)} />;
}
