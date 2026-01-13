import { Test, TestingModule } from '@nestjs/testing';
import { ReservationsController } from './reservations.controller';
import { ReservationsService } from './reservations.service';
import { UnauthorizedException } from '@nestjs/common';

describe('ReservationsController', () => {
  let controller: ReservationsController;
  let service: ReservationsService;

  // Service Mock
  const mockReservationsService = {
    findAllByUserId: jest.fn(),
    holdSeat: jest.fn(),
    confirmReservation: jest.fn(),
  };

  // Mock User & Request
  const mockUser = { id: 1, email: 'test@test.com' };
  const mockRequest = { user: mockUser };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ReservationsController],
      providers: [
        {
          provide: ReservationsService,
          useValue: mockReservationsService,
        },
      ],
    }).compile();

    controller = module.get<ReservationsController>(ReservationsController);
    service = module.get<ReservationsService>(ReservationsService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getReservations', () => {
    it('유저 ID로 예약 목록을 조회해야 함', async () => {
      const expectedResult = [{ id: 1, seatId: 10 }];
      mockReservationsService.findAllByUserId.mockResolvedValue(expectedResult);

      // @User() 데코레이터는 단위 테스트에서 직접 객체를 전달하여 테스트
      const result = await controller.getReservations(mockUser);

      expect(service.findAllByUserId).toHaveBeenCalledWith(mockUser.id);
      expect(result).toEqual(expectedResult);
    });
  });

  describe('holdSeat', () => {
    const dto = { seatId: 10, eventId: 1 }; // dto 예시

    it('좌석 선점(hold) 요청을 서비스로 전달해야 함', async () => {
      const expectedResult = { id: 1, status: 'HOLD' };
      mockReservationsService.holdSeat.mockResolvedValue(expectedResult);

      const result = await controller.holdSeat(mockRequest as any, dto);

      expect(service.holdSeat).toHaveBeenCalledWith(mockUser.id, dto.seatId);
      expect(result).toEqual(expectedResult);
    });

    it('Request에 유저 정보가 없으면 UnauthorizedException 던짐', async () => {
      const emptyRequest = {}; // 유저 없는 요청
      
      await expect(controller.holdSeat(emptyRequest as any, dto))
        .rejects.toThrow(UnauthorizedException);
    });
  });

  describe('confirmReservation', () => {
    const reservationId = 100;

    it('예약 확정 요청을 서비스로 전달해야 함', async () => {
      const expectedResult = { id: reservationId, status: 'CONFIRMED' };
      mockReservationsService.confirmReservation.mockResolvedValue(expectedResult);

      const result = await controller.confirmReservation(mockRequest as any, reservationId);

      expect(service.confirmReservation).toHaveBeenCalledWith(mockUser.id, reservationId);
      expect(result).toEqual(expectedResult);
    });

    it('Request에 유저 정보가 없으면 UnauthorizedException 던짐', async () => {
      const emptyRequest = {};
      
      await expect(controller.confirmReservation(emptyRequest as any, reservationId))
        .rejects.toThrow(UnauthorizedException);
    });
  });
});