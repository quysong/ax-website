import { useEffect, useRef, useState, type FormEvent } from "react";
import { styled } from "styled-components";
import {
  ArrowDown,
  ArrowUpRight,
  CalendarDays,
  Check,
  Clock3,
  Heart,
  MapPin,
  Send,
} from "lucide-react";
import { imageSlots, type ImageSlotId } from "./image-slots";
const WEDDING_DATE = new Date("2027-03-14T17:30:00+07:00");
const RSVP_ENDPOINT = import.meta.env.VITE_RSVP_ENDPOINT;
const COUNT_LABELS: Record<string, string> = {
  days: "NGÀY",
  hours: "GIỜ",
  minutes: "PHÚT",
  seconds: "GIÂY",
};
const Page = styled.main<{ $locked: boolean }>`
  overflow: hidden;
  background: #f8eee8;
  height: ${({ $locked }) => ($locked ? "100vh" : "auto")};
  @supports (height: 100svh) {
    height: ${({ $locked }) => ($locked ? "100svh" : "auto")};
  }
`;
const Eyebrow = styled.p`
  font-size: 13px;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: #ad8582;
  font-weight: 600;
`;
const Script = styled.span`
  font-family: "Caveat", cursive;
  font-weight: 600;
  color: #bd8991;
`;
const Heading = styled.h2`
  font-family: "Cormorant Garamond", serif;
  font-size: clamp(42px, 7vw, 76px);
  font-weight: 500;
  line-height: 0.95;
  letter-spacing: -0.035em;
  color: #715a55;
  margin: 12px 0 18px;
`;
const Section = styled.section<{
  $soft?: boolean;
}>`
  background: ${({ $soft }) => ($soft ? "#f4e7e4" : "#f8eee8")};
  padding: 110px max(24px, calc((100vw - 1080px) / 2));
  position: relative;
  @media (max-width: 640px) {
    padding: 76px 22px;
  }
`;
const Button = styled.button`
  border: 0;
  border-radius: 99px;
  padding: 14px 23px;
  background: #bd8991;
  color: white;
  font-size: 13px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  transition:
    transform 0.2s,
    background 0.2s;
  &:hover {
    transform: translateY(-2px);
    background: #a97680;
  }
  &:disabled {
    opacity: 0.55;
    cursor: wait;
  }
`;
const OutlineButton = styled(Button)`
  background: transparent;
  color: #795f59;
  border: 1px solid #d9bfc0;
  &:hover {
    background: #f7e8e6;
    color: #795f59;
  }
`;
function WeddingPhoto({
  slotId,
  src,
  alt,
  eager = false,
}: {
  slotId: ImageSlotId;
  src?: string;
  alt: string;
  eager?: boolean;
}) {
  const slot = imageSlots.find((imageSlot) => imageSlot.id === slotId);
  if (!src || !slot) return null;

  return (
    <img
      src={src}
      width={slot.width}
      height={slot.height}
      loading={eager ? "eager" : "lazy"}
      decoding="async"
      alt={alt}
      onLoad={(event) =>
        event.currentTarget.parentElement?.classList.add("has-image")
      }
      onError={(event) => {
        event.currentTarget.style.display = "none";
        event.currentTarget.parentElement?.classList.remove("has-image");
      }}
    />
  );
}
function Countdown() {
  const getTime = () => {
    const diff = Math.max(0, WEDDING_DATE.getTime() - Date.now());
    return {
      days: Math.floor(diff / 86400000),
      hours: Math.floor((diff % 86400000) / 3600000),
      minutes: Math.floor((diff % 3600000) / 60000),
      seconds: Math.floor((diff % 60000) / 1000),
    };
  };
  const [time, setTime] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });
  useEffect(() => {
    setTime(getTime());
    const timer = window.setInterval(() => setTime(getTime()), 1000);
    return () => window.clearInterval(timer);
  }, []);
  return (
    <CountGrid>
      {Object.entries(time).map(([label, value]) => (
        <CountUnit key={label}>
          <strong>{String(value).padStart(2, "0")}</strong>
          <span>{COUNT_LABELS[label] ?? label}</span>
        </CountUnit>
      ))}
    </CountGrid>
  );
}
function Envelope({ onOpen }: { onOpen: () => void }) {
  const [opening, setOpening] = useState(false);
  const open = () => {
    if (opening) return;
    setOpening(true);
    const delay = window.matchMedia("(prefers-reduced-motion: reduce)").matches
      ? 0
      : 1150;
    window.setTimeout(onOpen, delay);
  };
  return (
    <Intro className={opening ? "wedding-envelope opening" : "wedding-envelope"}>
      <IntroGrain />
      <IntroTop>
        <Eyebrow>THE WEDDING INVITATION · 2027</Eyebrow>
        <span className="tiny-star">✳</span>
      </IntroTop>
      <IntroCenter>
        <Script className="note">Gửi bạn một lời mời thật xinh...</Script>
        <EnvelopeWrap
          role="button"
          tabIndex={0}
          aria-label="Mở thiệp cưới"
          onClick={open}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") open();
          }}
        >
          <EnvelopeBack />
          <Letter>
            <span className="letter-kicker">SAVE THE DATE</span>
            <b>
              Anh <i>&</i> Xinh
            </b>
            <small>14 · 03 · 2027</small>
          </Letter>
          <EnvelopeFront />
          <EnvelopeFlap className={opening ? "opened" : ""} />
          <Wax
            onClick={(e) => {
              e.stopPropagation();
              open();
            }}
          >
            A <Heart size={15} fill="currentColor" /> X
          </Wax>
          <span className="sparkle s1">
            ✦
          </span>
          <span className="sparkle s2">
            ✳
          </span>
        </EnvelopeWrap>
        <p className="tap">CHẠM VÀO CON TEM ĐỂ MỞ THIỆP</p>
        <div className="intro-bottom">
          <span>14.03.2027</span>
          <span>♡</span>
          <span>DIAMOND PLACE 3</span>
        </div>
      </IntroCenter>
    </Intro>
  );
}
function RSVP() {
  const [name, setName] = useState("");
  const [attendance, setAttendance] = useState<"yes" | "no">("yes");
  const [guests, setGuests] = useState("2");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("loading");
    if (!RSVP_ENDPOINT) {
      setStatus("error");
      return;
    }
    const payload = {
      name,
      attendance,
      guests: attendance === "yes" ? Number(guests) : 0,
      message,
      submittedAt: new Date().toISOString(),
    };
    try {
      const response = await fetch(RSVP_ENDPOINT, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify(payload),
      });
      if (response.type !== "opaque" && !response.ok) {
        throw new Error("RSVP submission failed");
      }
      setStatus("success");
    } catch {
      setStatus("error");
    }
  }
  return (
    <RSVPCard>
      <div className="rsvp-stamp">
        PLEASE
        <br />
        REPLY
        <br />
        <Heart size={18} />
      </div>
      <Eyebrow>WE SAVED YOU A SEAT</Eyebrow>
      <h3>Hẹn gặp bạn nhé!</h3>
      <p className="sub">
        Sự hiện diện của bạn là món quà quý giá với chúng mình. Hãy cho Anh &
        Xinh biết bạn có thể đến chung vui nhé.
      </p>
      {status === "success" ? (
        <Success>
          <Check size={30} />
          <b>Cảm ơn bạn thật nhiều!</b>
          <span>Xác nhận của bạn đã được gửi đi.</span>
        </Success>
      ) : (
        <form onSubmit={submit}>
          <label>
            Họ và tên
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Tên của bạn"
            />
          </label>
          <label>
            Bạn sẽ đến chung vui chứ?
            <div className="choice">
              <button
                type="button"
                className={attendance === "yes" ? "active" : ""}
                onClick={() => setAttendance("yes")}
              >
                ♡ Có, chắc chắn rồi
              </button>
              <button
                type="button"
                className={attendance === "no" ? "active" : ""}
                onClick={() => setAttendance("no")}
              >
                Rất tiếc, mình bận
              </button>
            </div>
          </label>
          {attendance === "yes" && (
            <label>
              Số lượng khách
              <select
                value={guests}
                onChange={(e) => setGuests(e.target.value)}
              >
                <option value="1">1 người</option>
                <option value="2">2 người</option>
                <option value="3">3 người</option>
                <option value="4">4 người</option>
              </select>
            </label>
          )}
          <label>
            Gửi lời nhắn (không bắt buộc)
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Một lời chúc dành cho tụi mình..."
              rows={3}
            />
          </label>
          {status === "error" && (
            <p className="error">
              Chưa gửi được xác nhận. Bạn vui lòng thử lại nhé.
            </p>
          )}
          <Button type="submit" disabled={status === "loading"}>
            {status === "loading" ? "ĐANG GỬI..." : "GỬI XÁC NHẬN"}{" "}
            <Send size={14} />
          </Button>
          <small className="local-note">
            Thông tin xác nhận sẽ được gửi riêng đến Anh & Xinh.
          </small>
        </form>
      )}
    </RSVPCard>
  );
}
const StoryPhoto = styled.div`
  background: #fffdf9;
  padding: 10px 10px 34px;
  box-shadow: 0 12px 25px #765b5714;
  small {
    display: block;
    text-align: center;
    font-size: 13px;
    letter-spacing: 0.08em;
    margin-top: 10px;
    color: #ad8582;
  }
  .scene-two,
  .scene-three {
    position: relative;
    overflow: hidden;
  }
  .scene-two > img,
  .scene-three > img {
    position: absolute;
    inset: 0;
    z-index: 1;
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  .scene-two.has-image > span,
  .scene-three.has-image > span {
    visibility: hidden;
  }
  .scene-two,
  .scene-three {
    height: 230px;
    display: grid;
    place-items: center;
    background: linear-gradient(140deg, #d9c4c0, #b99d98);
    color: #fff;
    font:
      18px "Cormorant Garamond",
      serif;
    letter-spacing: 0.2em;
  }
  .scene-three {
    background: linear-gradient(140deg, #c9d3c1, #8e9d8d);
  }
  .scene-two,
  .scene-three {
    position: relative;
    overflow: hidden;
  }
  .scene-two > img,
  .scene-three > img {
    position: absolute;
    inset: 0;
    z-index: 1;
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  .scene-two.has-image > span,
  .scene-three.has-image > span {
    visibility: hidden;
  }
  @media (max-width: 720px) {
    .scene-two,
    .scene-three {
      height: 170px;
    }
  }
`;
const Sticker = styled.div`
  position: absolute;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  border-radius: 50%;
  box-shadow: 0 5px 14px #765b5710;
`;
export default function App() {
  const [opened, setOpened] = useState(false);
  const [imageUrls, setImageUrls] = useState<
    Partial<Record<ImageSlotId, string>>
  >({});
  const contentRef = useRef<HTMLDivElement>(null);
  const dateText = "Chủ Nhật, 14 tháng 03 năm 2027";
  useEffect(() => {
    let active = true;

    async function loadImages() {
      try {
        const response = await fetch("/api/images");
        if (!response.ok) {
          throw new Error(`Image list request failed (${response.status}).`);
        }
        const result = (await response.json()) as {
          images?: Partial<Record<ImageSlotId, string>>;
        };
        if (active) setImageUrls(result.images ?? {});
      } catch (error) {
        console.error("Could not load wedding images.", error);
      }
    }

    void loadImages();
    return () => {
      active = false;
    };
  }, []);
  useEffect(() => {
    const content = contentRef.current;
    if (!content) return;

    if (opened) {
      content.removeAttribute("inert");
    } else {
      content.setAttribute("inert", "");
    }
  }, [opened]);
  return (
    <Page $locked={!opened}>
      {!opened && (
        <Envelope
          onOpen={() => {
            setOpened(true);
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
        />
      )}
      <div ref={contentRef}>
          <Nav>
            <a href="#top" className="brand">
              A <Heart size={13} fill="currentColor" /> X
            </a>
            <div>
              <a href="#story">Chuyện chúng mình</a>
              <a href="#details">Ngày chung đôi</a>
              <a href="#rsvp">Xác nhận</a>
            </div>
          </Nav>
          <Hero id="top">
            <div className="hero-copy">
              <Eyebrow>WE ARE GETTING MARRIED</Eyebrow>
              <Script className="hero-script">A little love story</Script>
              <h1>
                Anh <em>&</em>
                <br />
                Xinh
              </h1>
              <p className="hero-date">
                14 <span>·</span> 03 <span>·</span> 2027
              </p>
              <p className="hero-desc">
                Tụi mình sắp viết nên chương mới của câu chuyện tình yêu. Và
                thật vui nếu có bạn ở đó.
              </p>
              <a href="#details" className="text-link">
                KHÁM PHÁ LỜI MỜI <ArrowDown size={14} />
              </a>
            </div>
            <div className="hero-visual">
              <div className="sunburst">✳</div>
              <Photo className="hero-photo">
                <div className="photo-scene scene-one">
                  <span>
                    YOUR PHOTO
                    <br />
                    GOES HERE
                  </span>
                  <small>ANALOG MEMORIES · 01</small>
                  <WeddingPhoto
                    slotId="hero"
                    src={imageUrls.hero}
                    alt="Ảnh cưới của Anh và Xinh"
                    eager
                  />
                </div>
                <div className="photo-caption">the beginning of forever</div>
              </Photo>
              <Sticker className="sticker-heart">
                ♡
                <small>
                  forever
                  <br />& always
                </small>
              </Sticker>
              <Sticker className="sticker-date">
                SAVE
                <br />
                THE DATE
                <br />
                <b>14·03·27</b>
              </Sticker>
              <div className="flower">✿</div>
            </div>
          </Hero>
          <Marquee>
            <span>
              MADE WITH LOVE ✳ ANH & XINH ✳ 14.03.2027 ✳ MADE WITH LOVE ✳ ANH &
              XINH ✳ 14.03.2027 ✳
            </span>
          </Marquee>
          <Section id="story">
            <Center>
              <Eyebrow>CHAPTER 01 · OUR STORY</Eyebrow>
              <Heading>
                Một chút tình yêu,
                <br />
                <i>một đời thương nhau.</i>
              </Heading>
              <p className="section-lead">
                Có những cuộc gặp gỡ tưởng chừng rất tình cờ, nhưng hóa ra lại
                là khởi đầu của điều tuyệt vời nhất.
              </p>
            </Center>
            <StoryGrid>
              <StoryPhoto className="story-a">
                <div className="scene-two">
                  <span>
                    PHOTO
                    <br />
                    01
                  </span>
                  <WeddingPhoto
                    slotId="story-1"
                    src={imageUrls["story-1"]}
                    alt="Khoảnh khắc đầu tiên trong chuyện tình của Anh và Xinh"
                  />
                </div>
                <small>THE DAY WE MET</small>
              </StoryPhoto>
              <StoryText className="story-text">
                <Script>Once upon a time...</Script>
                <h3>
                  Từ hai người xa lạ,
                  <br />
                  thành một gia đình.
                </h3>
                <p>
                  Tụi mình đã cùng đi qua những ngày bình thường nhất, gom góp
                  những khoảnh khắc nhỏ bé thành một câu chuyện thật đáng yêu.
                  Và giờ đây, tụi mình muốn viết tiếp câu chuyện ấy — cùng nhau,
                  mãi về sau.
                </p>
                <span className="hand-date">14 tháng 03, 2027 ♡</span>
              </StoryText>
              <StoryPhoto className="story-b">
                <div className="scene-three">
                  <span>
                    PHOTO
                    <br />
                    02
                  </span>
                  <WeddingPhoto
                    slotId="story-2"
                    src={imageUrls["story-2"]}
                    alt="Kỷ niệm của Anh và Xinh"
                  />
                </div>
                <small>OUR LITTLE WORLD</small>
              </StoryPhoto>
            </StoryGrid>
            <Doodle>♡</Doodle>
          </Section>
          <Section $soft id="details">
            <Center>
              <Eyebrow>CHAPTER 02 · THE BIG DAY</Eyebrow>
              <Heading>
                Ngày mình <i>chung đôi</i>
              </Heading>
              <p className="section-lead">
                Một ngày đặc biệt sẽ trọn vẹn hơn khi có những người thân yêu
                cùng hiện diện.
              </p>
              <Script className="date-script">{dateText}</Script>
              <Countdown />
            </Center>
            <DetailsGrid>
              <Detail>
                <div className="detail-icon">
                  <CalendarDays />
                </div>
                <Eyebrow>WHEN</Eyebrow>
                <h3>Chủ Nhật</h3>
                <p>14 tháng 03, 2027</p>
                <span>Đón khách · 17:00</span>
              </Detail>
              <Detail>
                <div className="detail-icon">
                  <Clock3 />
                </div>
                <Eyebrow>TIME</Eyebrow>
                <h3>Tiệc cưới</h3>
                <p>17:30 – 21:00</p>
                <span>Rất mong bạn đến đúng giờ</span>
              </Detail>
              <Detail>
                <div className="detail-icon">
                  <MapPin />
                </div>
                <Eyebrow>WHERE</Eyebrow>
                <h3>Diamond Place 3</h3>
                <p>Địa điểm tổ chức tiệc cưới</p>
                <span>Thông tin địa chỉ sẽ được cập nhật</span>
              </Detail>
            </DetailsGrid>
            <Center>
              <OutlineButton
                onClick={() =>
                  window.open(
                    "https://www.google.com/maps/search/?api=1&query=Diamond+Place+3+Vietnam",
                    "_blank",
                  )
                }
              >
                TÌM ĐƯỜNG ĐẾN TIỆC <ArrowUpRight size={15} />
              </OutlineButton>
            </Center>
          </Section>
          <Section id="gallery">
            <Center>
              <Eyebrow>CHAPTER 03 · LITTLE MOMENTS</Eyebrow>
              <Heading>
                Những ngày <i>thương nhớ</i>
              </Heading>
              <p className="section-lead">
                Một vài khung hình nhỏ, lưu lại những điều thật to.
              </p>
            </Center>
            <Gallery>
              <Photo className="g1">
                <div className="scene-four">
                  <span>
                    YOUR
                    <br />
                    PHOTO
                  </span>
                  <WeddingPhoto
                    slotId="gallery-1"
                    src={imageUrls["gallery-1"]}
                    alt="Ảnh cưới của Anh và Xinh trong bộ sưu tập"
                  />
                </div>
                <div className="photo-caption">a day to remember</div>
              </Photo>
              <Photo className="g2">
                <div className="scene-five">
                  <span>
                    YOUR
                    <br />
                    PHOTO
                  </span>
                  <WeddingPhoto
                    slotId="gallery-2"
                    src={imageUrls["gallery-2"]}
                    alt="Ảnh cưới thứ hai trong bộ sưu tập"
                  />
                </div>
                <div className="photo-caption">just the two of us</div>
              </Photo>
              <Photo className="g3">
                <div className="scene-six">
                  <span>
                    YOUR
                    <br />
                    PHOTO
                  </span>
                  <WeddingPhoto
                    slotId="gallery-3"
                    src={imageUrls["gallery-3"]}
                    alt="Ảnh cưới thứ ba trong bộ sưu tập"
                  />
                </div>
                <div className="photo-caption">happily ever after</div>
              </Photo>
            </Gallery>
            <Center>
              <Script>More memories are on the way...</Script>
            </Center>
          </Section>
          <Section $soft id="rsvp">
            <Center>
              <Eyebrow>CHAPTER 04 · YOU ARE INVITED</Eyebrow>
              <Heading>
                Đừng quên <i>đến nhé!</i>
              </Heading>
              <p className="section-lead">
                Tụi mình đã dành riêng một chỗ cho bạn.
              </p>
              <RSVP />
            </Center>
          </Section>
          <Footer>
            <div className="footer-flower">✿</div>
            <Script>With all our love</Script>
            <h2>
              Anh <i>&</i> Xinh
            </h2>
            <p>14 · 03 · 2027</p>
            <small>THANK YOU FOR BEING PART OF OUR STORY ♡</small>
            <button
              onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            >
              BACK TO TOP ↑
            </button>
          </Footer>
      </div>
    </Page>
  );
}
const Intro = styled.div`
  position: fixed;
  inset: 0;
  z-index: 20;
  min-height: 100vh;
  min-height: 100svh;
  display: flex;
  flex-direction: column;
  position: relative;
  padding: 30px 7vw 22px;
  background: radial-gradient(
    ellipse at 50% 46%,
    #fffaf6 0%,
    #f8eee8 65%,
    #f3e5df 100%
  );
  overflow: hidden;
  opacity: 1;
  transform: translateY(0);
  transition:
    opacity 650ms ease,
    transform 650ms ease;
  &.opening {
    opacity: 0;
    transform: translateY(-20px);
    pointer-events: none;
  }
  .tiny-star {
    color: #c58f98;
    font-size: 22px;
  }
  .note {
    font-size: clamp(25px, 4vw, 36px);
  }
  .tap {
    font-size: 13px;
    letter-spacing: 0.12em;
    color: #ad8582;
    margin-top: 36px;
  }
  .intro-bottom {
    display: flex;
    justify-content: space-between;
    max-width: 360px;
    width: 100%;
    margin: 70px auto 0;
    font-size: 13px;
    letter-spacing: 0.08em;
    color: #a88880;
  }
  .sparkle {
    position: absolute;
    color: #c18b94;
    font-size: 27px;
  }
  .s1 {
    right: -26px;
    top: 5px;
    animation: sparkle-one 3s ease-in-out infinite;
  }
  .s2 {
    left: -34px;
    bottom: 34px;
    animation: sparkle-two 2.5s ease-in-out infinite;
  }
  @keyframes sparkle-one {
    50% {
      transform: translateY(-8px) rotate(12deg);
    }
  }
  @keyframes sparkle-two {
    50% {
      transform: translateY(7px) rotate(-10deg);
    }
  }
`;
const IntroGrain = styled.div`position:absolute;inset:0;pointer-events:none;opacity:.16;background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 180 180' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='.18'/%3E%3C/svg%3E");}`;
const IntroTop = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  max-width: 1100px;
  width: 100%;
  margin: 0 auto;
  position: relative;
  z-index: 1;
  & p {
    margin: 0;
  }
`;
const IntroCenter = styled.div`
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  position: relative;
  z-index: 1;
  padding-top: 25px;
`;
const EnvelopeWrap = styled.div`
  position: relative;
  width: min(390px, 78vw);
  height: min(270px, 55vw);
  min-height: 205px;
  margin-top: 28px;
  cursor: pointer;
  perspective: 1000px;
  filter: drop-shadow(0 24px 22px #8d6b6022);
  &:focus-visible {
    outline: 2px solid #bd8991;
    outline-offset: 12px;
  }
`;
const EnvelopeBack = styled.div`
  position: absolute;
  inset: 0;
  background: #eacbd0;
  border-radius: 5px;
`;
const Letter = styled.div`
  position: absolute;
  left: 8%;
  right: 8%;
  top: 5%;
  height: 88%;
  background: #fffaf4;
  border: 1px solid #eadbd2;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 1;
  box-shadow: 0 3px 8px #765b5710;
  span {
    font-size: 13px;
    letter-spacing: 0.12em;
    color: #b58b88;
  }
  b {
    font:
      500 clamp(34px, 8vw, 48px) "Cormorant Garamond",
      serif;
    color: #765b57;
    margin: 8px 0;
  }
  i {
    color: #c58d98;
    font-weight: 400;
  }
  small {
    font-size: 13px;
    letter-spacing: 0.08em;
    color: #ad8582;
  }
`;
const EnvelopeFront = styled.div`
  position: absolute;
  inset: 0;
  z-index: 3;
  background: linear-gradient(145deg, #f2d8d9, #e8c4cb);
  clip-path: polygon(0 0, 50% 55%, 100% 0, 100% 100%, 0 100%);
  border-radius: 4px;
`;
const EnvelopeFlap = styled.div`
  position: absolute;
  inset: 0 0 auto;
  height: 58%;
  z-index: 4;
  background: #f6dfe0;
  clip-path: polygon(0 0, 100% 0, 50% 100%);
  transform-origin: top;
  transition: transform 0.8s cubic-bezier(0.2, 0.7, 0.2, 1);
  backface-visibility: hidden;
  &.opened {
    transform: rotateX(180deg);
    z-index: 0;
  }
`;
const Wax = styled.button`
  position: absolute;
  z-index: 5;
  left: 50%;
  top: 53%;
  transform: translate(-50%, -50%);
  width: 64px;
  height: 64px;
  border: 0;
  border-radius: 50%;
  background: #b77d86;
  color: #fff3ef;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 2px;
  font:
    600 13px "Cormorant Garamond",
    serif;
  box-shadow: 0 3px 7px #765b5730;
`;
const Nav = styled.nav`
  height: 70px;
  padding: 0 max(22px, calc((100vw - 1120px) / 2));
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid #eadbd2;
  background: #fffaf5;
  position: sticky;
  top: 0;
  z-index: 10;
  .brand {
    font:
      600 23px "Cormorant Garamond",
      serif;
    text-decoration: none;
    color: #9d7379;
    display: flex;
    align-items: center;
    gap: 4px;
  }
  div {
    display: flex;
    gap: 30px;
  }
  a {
    font-size: 13px;
    letter-spacing: 0.04em;
    text-decoration: none;
    color: #806a63;
  }
  button {
    display: flex;
    gap: 7px;
    align-items: center;
    border: 1px solid #e6d4ce;
    border-radius: 30px;
    background: transparent;
    padding: 9px 13px;
    color: #806a63;
    font-size: 13px;
  }
  @media (max-width: 700px) {
    height: 60px;
    div {
      display: none;
    }
    button span {
      display: none;
    }
  }
`;
const Hero = styled.section`
  min-height: 690px;
  padding: 95px max(26px, calc((100vw - 1050px) / 2)) 100px;
  display: grid;
  grid-template-columns: 1fr 1fr;
  align-items: center;
  gap: 40px;
  background: #f8eee8;
  position: relative;
  .hero-copy {
    padding-left: 5%;
  }
  .hero-script {
    font-size: 35px;
  }
  .hero-copy h1 {
    font:
      500 clamp(82px, 12vw, 145px)/0.72 "Cormorant Garamond",
      serif;
    letter-spacing: -0.07em;
    color: #725a54;
    margin: 30px 0;
  }
  .hero-copy h1 em {
    font-weight: 400;
    color: #c18b94;
    font-size: 0.75em;
  }
  .hero-date {
    font:
      500 18px "Cormorant Garamond",
      serif;
    letter-spacing: 0.18em;
    color: #a77c7c;
  }
  .hero-date span {
    color: #c18b94;
  }
  .hero-desc {
    max-width: 340px;
    font-size: 13px;
    line-height: 2;
    color: #8e7770;
    margin: 26px 0 32px;
  }
  .text-link {
    display: inline-flex;
    gap: 10px;
    align-items: center;
    text-decoration: none;
    font-size: 13px;
    letter-spacing: 0.08em;
    border-bottom: 1px solid #cda6a4;
    padding-bottom: 9px;
  }
  .hero-visual {
    height: 490px;
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .sunburst {
    position: absolute;
    top: 0;
    right: 12%;
    font-size: 90px;
    color: #d9c9e9;
    opacity: 0.8;
  }
  .flower {
    position: absolute;
    bottom: 15px;
    left: 6%;
    font-size: 60px;
    color: #b6c6af;
  }
  .sticker {
    position: absolute;
    display: flex;
    align-items: center;
    justify-content: center;
    text-align: center;
    border-radius: 50%;
    box-shadow: 0 5px 14px #765b5710;
  }
  .sticker-heart {
    width: 94px;
    height: 94px;
    background: #e9c6cc;
    color: #fff;
    font:
      40px "Cormorant Garamond",
      serif;
    right: 0;
    top: 80px;
    flex-direction: column;
  }
  .sticker-heart small {
    font:
      13px "Caveat",
      cursive;
    line-height: 1;
  }
  .sticker-date {
    width: 95px;
    height: 95px;
    background: #dce6d6;
    color: #7b8270;
    font-size: 13px;
    letter-spacing: 0.04em;
    left: 0;
    bottom: 65px;
    transform: rotate(-12deg);
    flex-direction: column;
  }
  .sticker-date b {
    font-size: 13px;
    margin-top: 4px;
  }
  @media (max-width: 760px) {
    min-height: 0;
    padding: 75px 24px 65px;
    grid-template-columns: 1fr;
    gap: 15px;
    text-align: center;
    .hero-copy {
      padding: 0;
    }
    .hero-desc {
      margin: 20px auto 25px;
    }
    .hero-visual {
      height: 390px;
    }
    .sticker-heart {
      right: 2%;
      top: 35px;
    }
    .sticker-date {
      left: 2%;
      bottom: 25px;
    }
  }
`;
const Photo = styled.div`
  background: #fffdf9;
  padding: 10px 10px 38px;
  box-shadow: 0 12px 30px #765b571c;
  position: relative;
  transform: rotate(3deg);
  .photo-caption {
    position: absolute;
    bottom: 10px;
    left: 0;
    right: 0;
    text-align: center;
    font:
      19px "Caveat",
      cursive;
    color: #9d7775;
  }
  .hero-photo {
    width: min(310px, 70%);
    height: 380px;
  }
  .scene-one,
  .scene-four,
  .scene-five,
  .scene-six {
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    text-align: center;
    color: #fffaf5;
    font:
      500 19px "Cormorant Garamond",
      serif;
    letter-spacing: 0.15em;
    background: linear-gradient(145deg, #d6c3bc, #9d827c 48%, #e7c9c6);
    position: relative;
    overflow: hidden;
  }
  .scene-one > img,
  .scene-four > img,
  .scene-five > img,
  .scene-six > img {
    position: absolute;
    inset: 0;
    z-index: 1;
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  .scene-one.has-image > span,
  .scene-one.has-image > small,
  .scene-four.has-image > span,
  .scene-five.has-image > span,
  .scene-six.has-image > span {
    visibility: hidden;
  }
  .scene-one:before,
  .scene-four:before,
  .scene-five:before,
  .scene-six:before {
    content: "";
    position: absolute;
    z-index: 2;
    inset: 12px;
    border: 1px solid #ffffff80;
    pointer-events: none;
  }
  .scene-one small {
    position: absolute;
    bottom: 24px;
    font:
      13px "Noto Sans",
      sans-serif;
    letter-spacing: 0.2em;
  }
`;
const Marquee = styled.div`
  overflow: hidden;
  background: #dce6d6;
  color: #71806e;
  padding: 13px 0;
  white-space: nowrap;
  font-size: 13px;
  letter-spacing: 0.1em;
  & span {
    display: block;
    animation: marquee 32s linear infinite;
  }
  @keyframes marquee {
    to {
      transform: translateX(-35%);
    }
  }
`;
const Center = styled.div`
  text-align: center;
  max-width: 700px;
  margin: 0 auto;
  .section-lead {
    font-size: 13px;
    line-height: 2;
    color: #927c75;
    max-width: 490px;
    margin: 0 auto 28px;
  }
  .date-script {
    font-size: 26px;
    display: block;
    margin: 22px 0 20px;
  }
`;
const StoryGrid = styled.div`
  max-width: 900px;
  margin: 80px auto 0;
  display: grid;
  grid-template-columns: 1fr 1.1fr 1fr;
  gap: 35px;
  align-items: center;
  .story-a {
    transform: rotate(-7deg);
    margin-top: -35px;
  }
  .story-b {
    transform: rotate(6deg);
    margin-top: 50px;
  }
  .story-a,
  .story-b {
    background: #fff;
    padding: 10px 10px 34px;
    box-shadow: 0 12px 25px #765b5714;
  }
  .story-a small,
  .story-b small {
    display: block;
    text-align: center;
    font-size: 13px;
    letter-spacing: 0.08em;
    margin-top: 10px;
    color: #ad8582;
  }
  .scene-two,
  .scene-three {
    height: 230px;
    display: grid;
    place-items: center;
    background: linear-gradient(140deg, #d9c4c0, #b99d98);
    color: #fff;
    font:
      18px "Cormorant Garamond",
      serif;
    letter-spacing: 0.2em;
  }
  .scene-three {
    background: linear-gradient(140deg, #c9d3c1, #8e9d8d);
  }
  @media (max-width: 720px) {
    grid-template-columns: 1fr 1fr;
    gap: 20px;
    margin-top: 55px;
    .story-a,
    .story-b {
      margin: 0;
    }
    .story-a .scene-two,
    .story-b .scene-three {
      height: 170px;
    }
    .story-text {
      grid-column: 1/-1;
      grid-row: 1;
      text-align: center;
    }
  }
`;
const StoryText = styled.div`
  padding: 20px 0;
  Script {
    font-size: 30px;
  }
  h3 {
    font:
      500 35px/1.05 "Cormorant Garamond",
      serif;
    color: #765b57;
    margin: 10px 0 15px;
  }
  p {
    font-size: 13px;
    line-height: 2.1;
    color: #927c75;
  }
  .hand-date {
    font:
      20px "Caveat",
      cursive;
    color: #b7838b;
  }
`;
const Doodle = styled.div`
  font:
    80px "Cormorant Garamond",
    serif;
  color: #e7c6ca;
  text-align: center;
  margin-top: 50px;
`;
const CountGrid = styled.div`
  display: flex;
  justify-content: center;
  gap: clamp(12px, 4vw, 40px);
  margin: 25px auto 65px;
`;
const CountUnit = styled.div`
  width: 76px;
  display: flex;
  flex-direction: column;
  gap: 5px;
  strong {
    font:
      500 48px "Cormorant Garamond",
      serif;
    color: #8e6d6a;
  }
  span {
    font-size: 13px;
    letter-spacing: 0.08em;
    color: #ad8582;
  }
`;
const DetailsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 18px;
  max-width: 960px;
  margin: 0 auto 45px;
  @media (max-width: 680px) {
    grid-template-columns: 1fr;
    max-width: 360px;
  }
`;
const Detail = styled.div`
  background: #fffaf5;
  border: 1px solid #eadbd2;
  padding: 32px 20px;
  text-align: center;
  min-height: 230px;
  .detail-icon {
    width: 42px;
    height: 42px;
    border-radius: 50%;
    background: #f3e1e0;
    color: #b7838b;
    display: grid;
    place-items: center;
    margin: 0 auto 18px;
  }
  p {
    font:
      20px "Cormorant Garamond",
      serif;
    color: #765b57;
    margin: 8px 0;
  }
  h3 {
    font:
      500 27px "Cormorant Garamond",
      serif;
    color: #765b57;
    margin: 7px 0;
  }
  span {
    font-size: 13px;
    color: #a18a81;
  }
  ${Eyebrow} {
    margin: 0;
  }
`;
const Gallery = styled.div`
  max-width: 900px;
  margin: 65px auto 35px;
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 30px;
  align-items: center;
  .g1 {
    transform: rotate(-5deg);
    height: 310px;
  }
  .g2 {
    transform: rotate(3deg);
    height: 360px;
  }
  .g3 {
    transform: rotate(6deg);
    height: 290px;
  }
  .g1 .scene-four {
    background: linear-gradient(140deg, #c4b2ad, #927a75);
  }
  .g2 .scene-five {
    background: linear-gradient(140deg, #d9c6ca, #b18491);
  }
  .g3 .scene-six {
    background: linear-gradient(140deg, #c9d5c3, #879782);
  }
  @media (max-width: 650px) {
    gap: 12px;
    .g1,
    .g2,
    .g3 {
      height: 210px;
      padding: 6px 6px 28px;
    }
    .g2 {
      height: 240px;
    }
    .photo-caption {
      font-size: 14px;
    }
  }
`;
const RSVPCard = styled.div`
  position: relative;
  max-width: 520px;
  margin: 45px auto 0;
  padding: 55px 48px 42px;
  background: #fffaf5;
  border: 1px solid #e9d8d1;
  box-shadow: 0 20px 60px #765b5710;
  text-align: left;
  .rsvp-stamp {
    position: absolute;
    right: 22px;
    top: 18px;
    width: 78px;
    height: 78px;
    border: 1px dashed #c99da0;
    border-radius: 50%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    color: #bd8991;
    font-size: 13px;
    letter-spacing: 0.04em;
    transform: rotate(10deg);
  }
  h3 {
    font:
      500 42px "Cormorant Garamond",
      serif;
    color: #765b57;
    margin: 5px 0 8px;
  }
  .sub {
    font-size: 13px;
    line-height: 1.9;
    color: #927c75;
    margin-bottom: 28px;
  }
  form {
    display: flex;
    flex-direction: column;
    gap: 17px;
  }
  label {
    font-size: 13px;
    letter-spacing: 0.03em;
    color: #8d716b;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  input,
  textarea,
  select {
    width: 100%;
    border: 1px solid #e8d8d1;
    background: #fffdf9;
    padding: 12px 13px;
    color: #765b57;
    border-radius: 2px;
    outline: none;
    font-size: 13px;
  }
  input:focus,
  textarea:focus,
  select:focus {
    border-color: #bd8991;
  }
  textarea {
    resize: vertical;
  }
  .choice {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
  }
  .choice button {
    border: 1px solid #e8d8d1;
    background: transparent;
    padding: 12px 7px;
    color: #927c75;
    font-size: 13px;
  }
  .choice button.active {
    border-color: #bd8991;
    background: #f8e9e8;
    color: #9d6e77;
  }
  .error {
    font-size: 13px;
    color: #b04e55;
  }
  .local-note {
    font-size: 13px;
    line-height: 1.6;
    color: #ad9890;
  }
  .success {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;
    padding: 30px 0;
    color: #9b7778;
  }
  .success b {
    font:
      28px "Cormorant Garamond",
      serif;
  }
  .success span {
    font-size: 13px;
  }
  @media (max-width: 520px) {
    padding: 48px 22px 30px;
    .rsvp-stamp {
      width: 68px;
      height: 68px;
      right: 10px;
      top: 10px;
    }
    h3 {
      font-size: 35px;
    }
  }
`;
const Success = styled.div.attrs({ className: "success" })``;
const Footer = styled.footer`
  padding: 80px 20px 45px;
  text-align: center;
  background: #ead6d5;
  color: #846a66;
  position: relative;
  .footer-flower {
    font-size: 45px;
    color: #b68b8e;
  }
  h2 {
    font:
      500 66px "Cormorant Garamond",
      serif;
    margin: 8px 0;
    color: #765b57;
  }
  h2 i {
    color: #b7838b;
    font-weight: 400;
  }
  p {
    font:
      16px "Cormorant Garamond",
      serif;
    letter-spacing: 0.2em;
  }
  small {
    font-size: 13px;
    letter-spacing: 0.08em;
  }
  button {
    display: block;
    margin: 32px auto 0;
    border: 0;
    border-bottom: 1px solid #b68b8e;
    background: none;
    padding: 0 0 7px;
    color: #846a66;
    font-size: 13px;
    letter-spacing: 0.08em;
  }
`;
