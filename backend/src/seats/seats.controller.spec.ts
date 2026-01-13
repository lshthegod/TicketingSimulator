import { Test, TestingModule } from '@nestjs/testing';
import { SeatsController } from './seats.controller';
import { SeatsService } from './seats.service';
import { CreateBulkSeatsDto } from './dto/create-bulk-seats.dto';

describe('SeatsController', () => {
  let controller: SeatsController;
  let service: SeatsService;

  // SeatsService Mocking
  const mockSeatsService = {
    findAllByEventId: jest.fn(),
    createBulk: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SeatsController],
      providers: [
        {
          provide: SeatsService,
          useValue: mockSeatsService,
        },
      ],
    }).compile();

    controller = module.get<SeatsController>(SeatsController);
    service = module.get<SeatsService>(SeatsService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAllByEventId', () => {
    it('eventId에 해당하는 좌석 목록을 반환해야 함', async () => {
      const eventId = 1;
      // Service가 반환하는 Slim 형태의 데이터 Mock
      const expectedResult = [
        { id: 1, no: 'A1', st: 'AVAILABLE' },
        { id: 2, no: 'A2', st: 'SOLD_OUT' },
      ];

      mockSeatsService.findAllByEventId.mockResolvedValue(expectedResult);

      const result = await controller.findAllByEventId(eventId);

      expect(service.findAllByEventId).toHaveBeenCalledWith(eventId);
      expect(result).toEqual(expectedResult);
    });
  });

  describe('createBulk', () => {
    it('대량 좌석 생성 요청을 서비스로 전달해야 함', async () => {
      const dto: CreateBulkSeatsDto = {
        eventId: 1,
        rowCount: 5,
        seatPerCol: 10,
      };
      
      const expectedResult = [{ id: 1, seatNo: 'A1' }]; // 생성 결과 예시
      mockSeatsService.createBulk.mockResolvedValue(expectedResult);

      const result = await controller.createBulk(dto);

      expect(service.createBulk).toHaveBeenCalledWith(dto);
      expect(result).toEqual(expectedResult);
    });
  });
});