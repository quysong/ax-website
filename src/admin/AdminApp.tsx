import { useEffect, useRef, useState, type FormEvent } from "react";
import { styled } from "styled-components";
import { upload } from "@vercel/blob/client";
import {
  ArrowLeft,
  Eye,
  EyeOff,
  ImagePlus,
  LogOut,
  Upload,
} from "lucide-react";
import {
  getImageBlobPath,
  isSupportedImageType,
  type ImageSlotId,
} from "../image-slots";

type ManagedSlot = {
  id: ImageSlotId;
  label: string;
  width: number;
  height: number;
  previewUrl: string;
};

type AdminResponse = {
  error?: string;
  slots?: ManagedSlot[];
};

const Shell = styled.main`
  min-height: 100vh;
  padding: 48px max(20px, calc((100vw - 1040px) / 2));
  background: #f8eee8;
  @media (max-width: 600px) {
    padding: 28px 16px 40px;
  }
`;

const Header = styled.header`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  margin-bottom: 36px;
  .brand {
    color: #806a63;
    text-decoration: none;
    font-size: 13px;
  }
  @media (max-width: 600px) {
    margin-bottom: 26px;
  }
`;

const Title = styled.h1`
  margin: 0;
  color: #715a55;
  font:
    500 clamp(36px, 7vw, 56px) / 1 "Cormorant Garamond",
    serif;
`;

const Intro = styled.p`
  max-width: 650px;
  margin: 14px 0 30px;
  color: #806a63;
  font-size: 15px;
  line-height: 1.8;
`;

const LoginCard = styled.form`
  max-width: 440px;
  padding: 28px;
  border: 1px solid #e9d8d1;
  background: #fffaf5;
  label {
    display: block;
    margin-bottom: 8px;
    color: #715a55;
    font-size: 14px;
  }
  input {
    width: 100%;
    min-height: 48px;
    padding: 10px 12px;
    border: 1px solid #dfcbc4;
    border-radius: 4px;
    background: white;
    color: #65514d;
    font: inherit;
    font-size: 15px;
  }
  .password-field {
    position: relative;
  }
  .password-field input {
    padding-right: 48px;
  }
  .password-visibility {
    position: absolute;
    top: 50%;
    right: 12px;
    display: grid;
    place-items: center;
    padding: 6px;
    border: 0;
    background: transparent;
    color: #806a63;
    cursor: pointer;
    transform: translateY(-50%);
  }
`;

const ActionButton = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 9px;
  min-height: 44px;
  margin-top: 16px;
  padding: 10px 18px;
  border: 0;
  border-radius: 99px;
  background: #bd8991;
  color: white;
  font: inherit;
  font-size: 14px;
  cursor: pointer;
  &:disabled {
    opacity: 0.6;
    cursor: wait;
  }
`;

const Message = styled.p<{ $error?: boolean }>`
  color: ${({ $error }) => ($error ? "#b04e55" : "#806a63")};
  font-size: 14px;
  line-height: 1.6;
`;

const SlotGrid = styled.section`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 290px), 1fr));
  gap: 20px;
`;

const SlotCard = styled.article`
  overflow: hidden;
  border: 1px solid #e9d8d1;
  background: #fffaf5;
  .preview {
    display: grid;
    place-items: center;
    position: relative;
    overflow: hidden;
    background: linear-gradient(140deg, #eadbd2, #f8eee8);
    color: #927c75;
    font-size: 14px;
    transition: box-shadow 160ms ease, background 160ms ease;
  }
  .preview.dragging {
    background: #f2dfda;
    box-shadow: inset 0 0 0 3px #bd8991;
  }
  .drop-hint {
    display: none;
    position: absolute;
    inset: 12px;
    z-index: 2;
    place-items: center;
    border: 1px dashed #bd8991;
    border-radius: 8px;
    background: #fffaf5e8;
    color: #715a55;
    font-size: 15px;
    font-weight: 600;
    pointer-events: none;
  }
  .preview.dragging .drop-hint {
    display: grid;
  }
  .preview img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    object-position: center;
  }
  .content {
    padding: 18px;
  }
  h2 {
    margin: 0;
    color: #715a55;
    font:
      500 26px / 1.1 "Cormorant Garamond",
      serif;
  }
  code {
    display: block;
    overflow-wrap: anywhere;
    margin-top: 8px;
    color: #927c75;
    font-size: 13px;
  }
  .sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    clip-path: inset(50%);
  }
  .guidance {
    margin: 10px 0 0;
    color: #806a63;
    font-size: 13px;
    line-height: 1.6;
  }
  @media (max-width: 600px) {
    .content {
      padding: 16px;
    }
    button {
      width: 100%;
    }
  }
`;

function AdminApp() {
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [slots, setSlots] = useState<ManagedSlot[]>([]);
  const [authenticated, setAuthenticated] = useState(false);
  const [busy, setBusy] = useState(false);
  const [busySlotId, setBusySlotId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [messageIsError, setMessageIsError] = useState(false);
  const [previewOverrides, setPreviewOverrides] = useState<
    Record<string, string>
  >({});
  const [draggingSlotId, setDraggingSlotId] = useState<string | null>(null);
  const previewUrls = useRef(new Map<string, string>());

  useEffect(
    () => () => {
      previewUrls.current.forEach((url) => URL.revokeObjectURL(url));
      previewUrls.current.clear();
    },
    [],
  );

  async function readResponse(response: Response): Promise<AdminResponse> {
    const contentType = response.headers.get("content-type") ?? "";
    if (!contentType.includes("application/json")) {
      const isLocal = ["localhost", "127.0.0.1", "::1"].includes(
        window.location.hostname,
      );
      const guidance = isLocal
        ? "Ở local, hãy chạy `npx vercel dev`."
        : "Trên Vercel, hãy kiểm tra Runtime Logs của function `/api/admin`.";
      throw new Error(
        `API quản trị trả phản hồi không phải JSON (HTTP ${response.status}). ${guidance}`,
      );
    }

    let result: AdminResponse;
    try {
      result = (await response.json()) as AdminResponse;
    } catch {
      throw new Error("API quản trị trả về dữ liệu không hợp lệ.");
    }
    if (!response.ok) {
      throw new Error(result.error ?? "Yêu cầu chưa thực hiện được.");
    }
    return result;
  }

  async function signIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    setMessageIsError(false);

    try {
      const response = await fetch("/api/admin", {
        headers: { Authorization: `Bearer ${password}` },
      });
      const result = await readResponse(response);
      setSlots(result.slots ?? []);
      setAuthenticated(true);
      setMessage("Đã kết nối với Vercel Blob.");
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Không thể kết nối quản trị.",
      );
      setMessageIsError(true);
    } finally {
      setBusy(false);
    }
  }

  async function uploadImage(slot: ManagedSlot, file: File) {
    if (!isSupportedImageType(file.type)) {
      setMessageIsError(true);
      setMessage("Vui lòng chọn ảnh JPEG, PNG, WebP hoặc AVIF.");
      return;
    }
    if (file.size > 20 * 1024 * 1024) {
      setMessageIsError(true);
      setMessage("Ảnh cần nhỏ hơn 20 MB trước khi tải lên.");
      return;
    }

    setBusySlotId(slot.id);
    setMessage("");
    setMessageIsError(false);
    let previewUrl = "";

    try {
      previewUrl = URL.createObjectURL(file);
      await new Promise<void>((resolve, reject) => {
        const image = new Image();
        image.onload = () => {
          if (image.naturalWidth === 0 || image.naturalHeight === 0) {
            reject(new Error("Tệp hình ảnh không hợp lệ."));
            return;
          }
          resolve();
        };
        image.onerror = () => reject(new Error("Không thể đọc tệp hình ảnh."));
        image.src = previewUrl;
      });

      const previousPreviewUrl = previewUrls.current.get(slot.id);
      if (previousPreviewUrl) URL.revokeObjectURL(previousPreviewUrl);
      previewUrls.current.set(slot.id, previewUrl);
      setPreviewOverrides((current) => ({ ...current, [slot.id]: previewUrl }));

      const optimizedFile = await optimizeImageForBlob(
        previewUrl,
        slot.width,
        slot.height,
      );
      if (optimizedFile.size > 20 * 1024 * 1024) {
        throw new Error("Ảnh sau khi tối ưu cần nhỏ hơn 20 MB.");
      }

      const blob = await upload(
        getImageBlobPath(slot.id, "image/webp"),
        optimizedFile,
        {
          access: "public",
          handleUploadUrl: "/api/admin",
          headers: { Authorization: `Bearer ${password}` },
          clientPayload: JSON.stringify({ slotId: slot.id }),
          multipart: true,
        },
      );
      if (!blob.url.startsWith("https://") || !blob.pathname) {
        throw new Error("Vercel Blob trả về thông tin ảnh không hợp lệ.");
      }

      setSlots((current) =>
        current.map((item) =>
          item.id === slot.id
            ? { ...item, previewUrl: blob.url }
            : item,
        ),
      );
      URL.revokeObjectURL(previewUrl);
      previewUrls.current.delete(slot.id);
      setPreviewOverrides((current) => {
        const next = { ...current };
        delete next[slot.id];
        return next;
      });
      setMessage(`Đã cập nhật "${slot.label}".`);
    } catch (error) {
      if (previewUrl && previewUrls.current.get(slot.id) !== previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
      setMessage(
        error instanceof Error ? error.message : "Không thể tải ảnh lên.",
      );
      setMessageIsError(true);
    } finally {
      setBusySlotId(null);
    }
  }

  function signOut() {
    setAuthenticated(false);
    setPassword("");
    setSlots([]);
    previewUrls.current.forEach((url) => URL.revokeObjectURL(url));
    previewUrls.current.clear();
    setPreviewOverrides({});
    setMessage("");
  }

  return (
    <Shell>
      <Header>
        <a className="brand" href="/">
          <ArrowLeft size={15} /> Về thiệp cưới
        </a>
        {authenticated && (
          <ActionButton type="button" onClick={signOut}>
            <LogOut size={15} /> Đăng xuất
          </ActionButton>
        )}
      </Header>
      <Title>Quản lý hình ảnh</Title>
      <Intro>
        Tải ảnh mới cho từng vị trí trên thiệp. Ảnh được lưu trên Vercel Blob
        và thay thế ảnh hiện tại ở vị trí đã chọn.
      </Intro>

      {!authenticated ? (
        <LoginCard onSubmit={signIn}>
          <label htmlFor="admin-password">Mật khẩu quản trị</label>
          <div className="password-field">
            <input
              id="admin-password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
            <button
              className="password-visibility"
              type="button"
              aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
              aria-pressed={showPassword}
              onClick={() => setShowPassword((visible) => !visible)}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          <ActionButton type="submit" disabled={busy}>
            {busy ? "ĐANG KẾT NỐI..." : "VÀO QUẢN LÝ"}
          </ActionButton>
        </LoginCard>
      ) : (
        <SlotGrid aria-label="Các vị trí ảnh trên thiệp">
          {slots.map((slot) => (
            <SlotCard key={slot.id}>
              <ImagePreview
                key={previewOverrides[slot.id] ?? slot.previewUrl}
                src={previewOverrides[slot.id] ?? slot.previewUrl}
                alt={slot.label}
                width={slot.width}
                height={slot.height}
                dragging={draggingSlotId === slot.id}
                onDragEnter={() => setDraggingSlotId(slot.id)}
                onDragLeave={() => setDraggingSlotId(null)}
                onDrop={(file) => {
                  setDraggingSlotId(null);
                  if (file) void uploadImage(slot, file);
                }}
              />
              <div className="content">
                <h2>{slot.label}</h2>
                <code>Vercel Blob · wedding/{slot.id}/</code>
                <p className="guidance">
                  Gợi ý: {slot.width} × {slot.height} px (tỷ lệ{" "}
                  {getAspectRatio(slot.width, slot.height)}). Ảnh sẽ được căn
                  giữa và cắt vừa khung xem trước; ảnh lưu lên Blob được tối ưu
                  WebP theo tỷ lệ gốc.
                  <br />
                  Kéo ảnh vào khung hoặc nhấn “THAY ẢNH” để tải lên.
                </p>
                <label>
                  <span className="sr-only">Chọn ảnh cho {slot.label}</span>
                  <input
                    type="file"
                    accept="image/*"
                    data-slot={slot.id}
                    className="sr-only"
                    disabled={busySlotId !== null}
                    onChange={(event) => {
                      const file = event.currentTarget.files?.[0];
                      if (file) void uploadImage(slot, file);
                      event.currentTarget.value = "";
                    }}
                  />
                </label>
                <ActionButton
                  type="button"
                  disabled={busySlotId !== null}
                  onClick={() =>
                    document
                      .querySelector<HTMLInputElement>(
                        `input[type="file"][data-slot="${slot.id}"]`,
                      )
                      ?.click()
                  }
                >
                  <Upload size={15} />
                  {busySlotId === slot.id ? "ĐANG TẢI LÊN..." : "THAY ẢNH"}
                </ActionButton>
              </div>
            </SlotCard>
          ))}
        </SlotGrid>
      )}

      {message && <Message $error={messageIsError}>{message}</Message>}
      {authenticated && slots.length === 0 && (
        <Message $error>
          Không tìm thấy vị trí ảnh. Tải lại trang để thử lại.
        </Message>
      )}
    </Shell>
  );
}

function getAspectRatio(width: number, height: number): string {
  let a = width;
  let b = height;
  while (b !== 0) {
    [a, b] = [b, a % b];
  }
  return `${width / a}:${height / a}`;
}

async function optimizeImageForBlob(
  sourceUrl: string,
  maxWidth: number,
  maxHeight: number,
): Promise<File> {
  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const loadedImage = new Image();
    loadedImage.onload = () => resolve(loadedImage);
    loadedImage.onerror = () => reject(new Error("Không thể đọc tệp hình ảnh."));
    loadedImage.src = sourceUrl;
  });
  const scale = Math.min(
    1,
    maxWidth / image.naturalWidth,
    maxHeight / image.naturalHeight,
  );
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
  canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Không thể tối ưu ảnh trên trình duyệt này.");
  context.drawImage(image, 0, 0, canvas.width, canvas.height);

  const webp = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (result) =>
        result
          ? resolve(result)
          : reject(new Error("Không thể chuyển ảnh sang định dạng WebP.")),
      "image/webp",
      0.84,
    );
  });

  return new File([webp], "image.webp", {
    type: "image/webp",
    lastModified: Date.now(),
  });
}

function ImagePreview({
  src,
  alt,
  width,
  height,
  dragging,
  onDragEnter,
  onDragLeave,
  onDrop,
}: {
  src: string;
  alt: string;
  width: number;
  height: number;
  dragging: boolean;
  onDragEnter: () => void;
  onDragLeave: () => void;
  onDrop: (file: File | undefined) => void;
}) {
  const [failed, setFailed] = useState(false);

  return (
    <div
      className={`preview${dragging ? " dragging" : ""}`}
      style={{ aspectRatio: `${width} / ${height}` }}
      onDragOver={(event) => {
        if (Array.from(event.dataTransfer.types).includes("Files")) {
          event.preventDefault();
          event.dataTransfer.dropEffect = "copy";
        }
      }}
      onDragEnter={(event) => {
        if (Array.from(event.dataTransfer.types).includes("Files")) {
          event.preventDefault();
          onDragEnter();
        }
      }}
      onDragLeave={(event) => {
        if (
          !(event.relatedTarget instanceof Node) ||
          !event.currentTarget.contains(event.relatedTarget)
        ) {
          onDragLeave();
        }
      }}
      onDrop={(event) => {
        event.preventDefault();
        onDrop(event.dataTransfer.files[0]);
      }}
    >
      {failed || !src ? (
        <>
          <ImagePlus size={24} aria-hidden="true" />
          <span>Chưa có ảnh</span>
        </>
      ) : (
        <img src={src} alt={alt} onError={() => setFailed(true)} />
      )}
      <span className="drop-hint" aria-hidden="true">
        Thả ảnh để tải lên
      </span>
    </div>
  );
}

export default AdminApp;
