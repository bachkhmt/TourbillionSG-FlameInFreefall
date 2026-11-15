import React from 'react';
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import {
  LabLightsTransition,
  InteractiveGapDemo,
  LockedPredictiveDemo,
  ValueRevealDeck,
  useEmberStore,
} from '@/features/ember-zero';

describe('Task 4 - Ember Zero Act II: Lab Lights Transition & Value Reveal Deck', () => {
  beforeEach(() => {
    useEmberStore.getState().reset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('LabLightsTransition Component', () => {
    it('renders container with data-testid="lab-lights-transition"', () => {
      render(<LabLightsTransition />);
      expect(screen.getByTestId('lab-lights-transition')).toBeInTheDocument();
    });

    it('displays the transition messages: "Bật đèn phòng thí nghiệm" and narrative subtitle', () => {
      render(<LabLightsTransition />);
      expect(screen.getAllByText(/bật đèn phòng thí nghiệm/i).length).toBeGreaterThan(0);
      expect(
        screen.getByText(/từ ngọn lửa vô định hình trong bóng tối.*đến hệ thống trí tuệ an toàn hỏa hoạn có cấu trúc/i)
      ).toBeInTheDocument();
    });

    it('features an interactive light switch / toggle that toggles lab lights state', () => {
      render(<LabLightsTransition />);
      const switchBtn = screen.getByRole('switch', { name: /bật đèn phòng thí nghiệm|lab lights switch/i });
      expect(switchBtn).toBeInTheDocument();

      // Initial state is lit or reflects toggle
      const initialChecked = switchBtn.getAttribute('aria-checked');
      fireEvent.click(switchBtn);
      const afterChecked = switchBtn.getAttribute('aria-checked');
      expect(afterChecked).not.toEqual(initialChecked);

      // Verify status text presence
      const container = screen.getByTestId('lab-lights-transition');
      expect(container.textContent).toMatch(/phòng thí nghiệm|structpaper|kiến trúc/i);
    });
  });

  describe('InteractiveGapDemo Component', () => {
    it('renders container with data-testid="interactive-gap-demo"', () => {
      render(<InteractiveGapDemo />);
      expect(screen.getByTestId('interactive-gap-demo')).toBeInTheDocument();
    });

    it('displays 6-dimension matrix tags (Gravity, Pressure, Oxygen, Flow Velocity, Chamber Temp, Material)', () => {
      render(<InteractiveGapDemo />);
      const container = screen.getByTestId('interactive-gap-demo');
      expect(container.textContent).toMatch(/trọng lực|gravity/i);
      expect(container.textContent).toMatch(/áp suất|pressure/i);
      expect(container.textContent).toMatch(/nồng độ o₂|oxygen/i);
      expect(container.textContent).toMatch(/vận tốc dòng khí|flow velocity/i);
      expect(container.textContent).toMatch(/nhiệt độ buồng|chamber temp/i);
      expect(container.textContent).toMatch(/vật liệu|material/i);
    });

    it('allows selecting gravity environments (Earth 1.00g, ISS 0.00g, Moon 0.16g, Mars 0.38g)', () => {
      render(<InteractiveGapDemo />);
      const earthBtn = screen.getByRole('button', { name: /trái đất|1\.00g/i });
      const issBtn = screen.getByRole('button', { name: /iss|0\.00g/i });
      const moonBtn = screen.getByRole('button', { name: /mặt trăng|moon|0\.16g/i });
      const marsBtn = screen.getByRole('button', { name: /sao hỏa|mars|0\.38g/i });

      expect(earthBtn).toBeInTheDocument();
      expect(issBtn).toBeInTheDocument();
      expect(moonBtn).toBeInTheDocument();
      expect(marsBtn).toBeInTheDocument();
    });

    it('highlights empirical data gap with red badge and warning when Moon 0.16g is selected', () => {
      render(<InteractiveGapDemo />);
      const moonBtn = screen.getByRole('button', { name: /mặt trăng|moon|0\.16g/i });
      fireEvent.click(moonBtn);

      const warningBadge = screen.getByTestId('gap-status-badge');
      expect(warningBadge.textContent).toMatch(/CRITICAL GAP|LỖ HỔNG THỰC NGHIỆM ĐỎ/i);

      const container = screen.getByTestId('interactive-gap-demo');
      expect(container.textContent).toMatch(/NASA.*(chưa|không có|no direct).*lunar|mặt trăng chưa có dữ liệu đốt thực nghiệm trực tiếp/i);
    });

    it('shows verified or matched empirical status when Earth or ISS is selected', () => {
      render(<InteractiveGapDemo />);
      const issBtn = screen.getByRole('button', { name: /iss|0\.00g/i });
      fireEvent.click(issBtn);

      const badge = screen.getByTestId('gap-status-badge');
      expect(badge.textContent).toMatch(/MATCH|VERIFIED|ĐÃ KIỂM CHỨNG|PARTIAL/i);
    });
  });

  describe('LockedPredictiveDemo Component', () => {
    it('renders container with data-testid="locked-predictive-demo"', () => {
      render(<LockedPredictiveDemo />);
      expect(screen.getByTestId('locked-predictive-demo')).toBeInTheDocument();
    });

    it('shows LOCKED status ("PREDICTION LOCKED" / "KHÓA DỰ ĐOÁN") under unverified Lunar conditions', () => {
      render(<LockedPredictiveDemo defaultEnvironment="moon" />);
      const lockStatus = screen.getByTestId('prediction-lock-badge');
      expect(lockStatus.textContent).toMatch(/PREDICTION LOCKED|KHÓA DỰ ĐOÁN/i);
    });

    it('displays 3-prerequisites checklist (Định luật bảo toàn, Dữ liệu thực nghiệm tương đồng >= 3 runs, Cảnh báo sai số)', () => {
      render(<LockedPredictiveDemo />);
      const container = screen.getByTestId('locked-predictive-demo');
      expect(container.textContent).toMatch(/định luật bảo toàn|conservation/i);
      expect(container.textContent).toMatch(/dữ liệu thực nghiệm tương đồng.*>=?\s*3/i);
      expect(container.textContent).toMatch(/cảnh báo sai số|sai số|uncertainty/i);
    });

    it('displays honesty punchline ("Một hệ thống AI trung thực" / "DỮ LIỆU CHƯA ĐỦ ĐỂ ĐOÁN LIỀU")', () => {
      render(<LockedPredictiveDemo />);
      const container = screen.getByTestId('locked-predictive-demo');
      expect(container.textContent).toMatch(/một hệ thống ai trung thực|dữ liệu chưa đủ để đoán liều|tôi không biết/i);
    });

    it('provides button to switch to SoFIE-MIST analogous match mode displaying similarity score', () => {
      render(<LockedPredictiveDemo />);
      const matchBtn = screen.getByRole('button', { name: /SoFIE-MIST|chế độ tương đồng|analogous match/i });
      expect(matchBtn).toBeInTheDocument();

      fireEvent.click(matchBtn);
      const container = screen.getByTestId('locked-predictive-demo');
      expect(container.textContent).toMatch(/94\.2%/);
      expect(container.textContent).toMatch(/SoFIE-MIST/i);
      expect(container.textContent).toMatch(/lò sưởi bức xạ|dây nhiệt dẫn lửa|thời gian trễ bắt lửa/i);
    });
  });

  describe('ValueRevealDeck Component', () => {
    it('renders container with data-testid="value-reveal-deck"', () => {
      render(<ValueRevealDeck />);
      expect(screen.getByTestId('value-reveal-deck')).toBeInTheDocument();
    });

    it('renders all 6 Value Beats', () => {
      render(<ValueRevealDeck />);
      const deck = screen.getByTestId('value-reveal-deck');
      expect(deck.textContent).toMatch(/tro tàn.*kho tàng/i);
      expect(deck.textContent).toMatch(/chòm sao so sánh/i);
      expect(deck.textContent).toMatch(/bản đồ lỗ hổng/i);
      expect(deck.textContent).toMatch(/so khớp sofie-mist|sofie-mist/i);
      expect(deck.textContent).toMatch(/cỗ máy trung thực/i);
      expect(deck.textContent).toMatch(/về trái đất/i);
    });

    it('allows switching / clicking through the 6 beats', () => {
      render(<ValueRevealDeck />);
      const beatButtons = screen.getAllByRole('tab');
      expect(beatButtons.length).toBe(6);

      // Click Beat 3 (Bản đồ lỗ hổng)
      fireEvent.click(beatButtons[2]);
      expect(screen.getByTestId('interactive-gap-demo')).toBeInTheDocument();

      // Click Beat 5 (Cỗ máy trung thực)
      fireEvent.click(beatButtons[4]);
      expect(screen.getByTestId('locked-predictive-demo')).toBeInTheDocument();
    });

    it('includes master metrics: 20 studies, 1,200+ test runs, <2s latency, and CSV export preview', () => {
      render(<ValueRevealDeck />);
      const deck = screen.getByTestId('value-reveal-deck');
      expect(deck.textContent).toMatch(/20/);
      expect(deck.textContent).toMatch(/1,?200\+/);
      expect(deck.textContent).toMatch(/<2s|< 2s/i);

      const csvButton = screen.getByRole('button', { name: /xuất csv|export csv/i });
      expect(csvButton).toBeInTheDocument();
    });
  });
});
