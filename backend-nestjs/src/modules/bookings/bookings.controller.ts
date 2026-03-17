import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  Request,
  ParseIntPipe,
  BadRequestException,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { BookingsService } from './bookings.service';
import { FileUploadService } from './file-upload.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { UpdateBookingDto } from './dto/update-booking.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { BookingStatus } from '@prisma/client';

interface MulterFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
}

// Helper function to transform booking response for frontend
const transformBooking = (booking: any) => {
  if (!booking) return booking;
  
  return {
    ...booking,
    bookingId: booking.id,
    bookingStatus: booking.status?.name || 'UNKNOWN',
    receiptImageUrl: booking.receiptImageUrl || null,
    totalCost: booking.totalCost ? parseFloat(booking.totalCost.toString()) : null,
    hotel: {
      id: booking.hotel?.id,
      name: booking.hotel?.name,
      contactInfo: booking.hotel?.contactInfo,
      active: booking.hotel?.active,
      ownerName: booking.hotel?.ownerName,
    },
    client: {
      id: booking.user?.id,
      fullName: booking.user?.fullName,
      username: booking.user?.username,
      email: booking.user?.email,
      phone: booking.clientPhone,
    },
    messages: booking.messages?.map((m: any) => ({
      id: m.id,
      senderId: m.userId,
      senderName: m.user?.fullName || m.user?.username || 'Unknown',
      message: m.message,
      messageType: m.isFromOwner ? 'OWNER' : 'GENERAL',
      isRead: false,
      createdAt: m.createdAt,
    })) || [],
  };
};

@ApiTags('Bookings')
@Controller('api/bookings')
export class BookingsController {
  constructor(
    private bookingsService: BookingsService,
    private fileUploadService: FileUploadService,
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create booking' })
  async create(
    @Body() createBookingDto: CreateBookingDto,
    @Query('userId', ParseIntPipe) userId: number,
    @Request() req: any,
  ) {
    const booking = await this.bookingsService.create(createBookingDto, userId || req.user.userId);
    return transformBooking(booking);
  }

  @Get('my')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get my bookings' })
  async getMyBookings(
    @Query('userId', ParseIntPipe) userId: number,
    @Request() req: any,
  ) {
    const result = await this.bookingsService.getBookingsByUser(userId || req.user.userId, 0, 100);
    return result.bookings.map(transformBooking);
  }

  @Get('hotel/:hotelId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get bookings for hotel' })
  async getHotelBookings(
    @Param('hotelId', ParseIntPipe) hotelId: number,
    @Query('ownerId') ownerId?: string,
    @Query('skip') skip = 0,
    @Query('take') take = 10,
  ) {
    const result = await this.bookingsService.getBookingsByHotel(hotelId, skip, take);
    return result.bookings.map(transformBooking);
  }

  @Get('owner')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get owner bookings' })
  async getOwnerBookings(
    @Query('ownerId', ParseIntPipe) ownerId: number,
    @Request() req: any,
  ) {
    // Get all hotels owned by this owner, then get their bookings
    const result = await this.bookingsService.getOwnerBookings(ownerId || req.user.userId);
    return result.bookings.map(transformBooking);
  }

  @Post(':id/accept')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Accept booking request' })
  async acceptBooking(
    @Param('id', ParseIntPipe) id: number,
    @Query('ownerId', ParseIntPipe) ownerId: number,
  ) {
    const booking = await this.bookingsService.acceptBookingRequest(id, ownerId);
    return transformBooking(booking);
  }

  @Post(':id/cost')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Propose cost for booking' })
  async proposeCost(
    @Param('id', ParseIntPipe) id: number,
    @Query('cost') cost: string,
    @Query('ownerId', ParseIntPipe) ownerId: number,
  ) {
    const costDecimal = parseFloat(cost);
    if (isNaN(costDecimal)) {
      throw new BadRequestException('Cost must be a valid number');
    }
    const booking = await this.bookingsService.proposeCost(id, costDecimal, ownerId);
    return transformBooking(booking);
  }

  @Post(':id/approve')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Approve booking' })
  async approveBooking(
    @Param('id', ParseIntPipe) id: number,
    @Query('ownerId', ParseIntPipe) ownerId: number,
  ) {
    const booking = await this.bookingsService.approveBooking(id, ownerId);
    return transformBooking(booking);
  }

  @Post(':id/reject')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Reject booking' })
  async rejectBooking(
    @Param('id', ParseIntPipe) id: number,
    @Query('reason') reason: string,
    @Query('ownerId', ParseIntPipe) ownerId: number,
  ) {
    const booking = await this.bookingsService.rejectBooking(id, reason, ownerId);
    return transformBooking(booking);
  }

  @Post(':id/receipt')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Upload receipt URL' })
  async uploadReceipt(
    @Param('id', ParseIntPipe) id: number,
    @Query('receiptUrl') receiptUrl: string,
    @Query('userId', ParseIntPipe) userId: number,
  ) {
    const booking = await this.bookingsService.uploadReceipt(id, receiptUrl, userId);
    return transformBooking(booking);
  }

  @Post(':id/receipt/upload')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('file'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Upload receipt file' })
  async uploadReceiptFile(
    @Param('id', ParseIntPipe) id: number,
    @Query('userId', ParseIntPipe) userId: number,
    @UploadedFile() file: MulterFile,
  ) {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    // Upload file and get URL
    const receiptUrl = this.fileUploadService.uploadFile(file, 'receipts');

    // Update booking with receipt URL and transition to PAID status
    const booking = await this.bookingsService.uploadReceipt(id, receiptUrl, userId);
    return transformBooking(booking);
  }

  @Post(':id/problem')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Report problem with booking' })
  async reportProblem(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { problem: string },
    @Query('userId') userId?: string,
  ) {
    const booking = await this.bookingsService.update(id, { 
      problemReport: body.problem as any,
      problemReported: true as any,
    });
    return transformBooking(booking);
  }

  @Post(':id/message')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Send message on booking' })
  async sendMessage(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { message: string },
    @Request() req: any,
    @Query('userId') userId?: string,
  ) {
    const booking = await this.bookingsService.addMessage(
      id,
      userId ? parseInt(userId) : req.user.userId,
      body.message,
      false,
    );
    return transformBooking(booking);
  }

  @Post(':id/owner-message')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Send message from owner' })
  async ownerSendMessage(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { message: string },
    @Request() req: any,
    @Query('ownerId') ownerId?: string,
  ) {
    const booking = await this.bookingsService.addMessage(
      id,
      ownerId ? parseInt(ownerId) : req.user.userId,
      body.message,
      true,
    );
    return transformBooking(booking);
  }

  @Get('admin/all')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all bookings (admin)' })
  async getAllBookings(
    @Query('page') page = 0,
    @Query('size') size = 20,
  ) {
    const pageNum = parseInt(page as any) || 0;
    const sizeNum = parseInt(size as any) || 20;
    const result = await this.bookingsService.findAll(pageNum * sizeNum, sizeNum);
    return {
      content: (result.bookings || []).map(transformBooking),
      totalElements: result.total || 0,
      totalPages: Math.ceil((result.total || 0) / sizeNum),
    };
  }

  @Get('admin/problems')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get problem bookings (admin)' })
  async getProblemBookings() {
    const result = await this.bookingsService.findAll(0, 1000);
    return (result.bookings || []).filter((b: any) => b.problemReported).map(transformBooking);
  }

  @Post('admin/:id/resolve')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Resolve booking problem (admin)' })
  async adminResolve(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { resolution: string },
  ) {
    const booking = await this.bookingsService.update(id, { problemReport: body.resolution as any });
    return transformBooking(booking);
  }

  @Get()
  @ApiOperation({ summary: 'Get all bookings' })
  async findAll(
    @Query('skip') skip = 0,
    @Query('take') take = 10,
    @Query('hotelId') hotelId?: string,
    @Query('userId') userId?: string,
  ) {
    const result = await this.bookingsService.findAll(
      skip,
      take,
      hotelId ? parseInt(hotelId) : undefined,
      userId ? parseInt(userId) : undefined,
    );
    return result.bookings.map(transformBooking);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get booking by ID' })
  async findById(
    @Param('id', ParseIntPipe) id: number,
    @Query('userId') userId?: string,
  ) {
    const booking = await this.bookingsService.findById(id);
    return transformBooking(booking);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update booking' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateBookingDto: UpdateBookingDto,
  ) {
    const booking = await this.bookingsService.update(id, updateBookingDto);
    return transformBooking(booking);
  }

  @Put(':id/status')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update booking status' })
  async updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { status: BookingStatus },
  ) {
    const booking = await this.bookingsService.updateStatus(id, body.status);
    return transformBooking(booking);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete booking' })
  async delete(@Param('id', ParseIntPipe) id: number) {
    return this.bookingsService.delete(id);
  }

  @Post(':id/messages')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Add message to booking' })
  async addMessage(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { message: string; isFromOwner: boolean },
    @Request() req: any,
  ) {
    const booking = await this.bookingsService.addMessage(
      id,
      req.user.userId,
      body.message,
      body.isFromOwner,
    );
    return transformBooking(booking);
  }
}
