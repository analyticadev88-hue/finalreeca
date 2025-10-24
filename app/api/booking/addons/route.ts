import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import Stripe from "stripe";
import nodemailer from "nodemailer";
import pdf from "html-pdf";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-08-27.basil",
});

// Helper function to generate HTML for the ticket
function generateTicketHTML(bookingData: any) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <title>Reeca Travel Ticket</title>
        <style>
            body {
                font-family: Arial, sans-serif;
                margin: 0;
                padding: 20px;
                background-color: #f5f5f5;
            }
            .ticket-container {
                max-width: 800px;
                margin: 0 auto;
                background: white;
                padding: 30px;
                border-radius: 10px;
                box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            }
            .header {
                text-align: center;
                border-bottom: 2px solid #007bff;
                padding-bottom: 20px;
                margin-bottom: 30px;
            }
            .company-name {
                font-size: 28px;
                font-weight: bold;
                color: #007bff;
                margin-bottom: 10px;
            }
            .ticket-title {
                font-size: 18px;
                color: #666;
            }
            .booking-info {
                display: flex;
                justify-content: space-between;
                margin-bottom: 30px;
                padding: 20px;
                background-color: #f8f9fa;
                border-radius: 8px;
            }
            .info-group {
                flex: 1;
            }
            .info-label {
                font-weight: bold;
                color: #333;
                margin-bottom: 5px;
            }
            .info-value {
                color: #666;
                margin-bottom: 15px;
            }
            .trip-section {
                margin-bottom: 30px;
                border: 1px solid #ddd;
                border-radius: 8px;
                padding: 20px;
            }
            .trip-header {
                font-size: 20px;
                font-weight: bold;
                color: #007bff;
                margin-bottom: 15px;
                border-bottom: 1px solid #eee;
                padding-bottom: 10px;
            }
            .trip-details {
                display: grid;
                grid-template-columns: repeat(2, 1fr);
                gap: 15px;
                margin-bottom: 20px;
            }
            .passengers-section {
                margin-top: 20px;
            }
            .passenger-list {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
                gap: 10px;
                margin-top: 10px;
            }
            .passenger-item {
                padding: 10px;
                background-color: #f8f9fa;
                border-radius: 5px;
                border-left: 4px solid #007bff;
            }
            .addons-section {
                margin-top: 30px;
                padding: 20px;
                background-color: #f8f9fa;
                border-radius: 8px;
            }
            .addon-item {
                padding: 10px;
                margin-bottom: 10px;
                background-color: white;
                border-radius: 5px;
                border-left: 4px solid #28a745;
            }
            .footer {
                text-align: center;
                margin-top: 40px;
                padding-top: 20px;
                border-top: 1px solid #ddd;
                color: #666;
                font-size: 14px;
            }
        </style>
    </head>
    <body>
        <div class="ticket-container">
            <div class="header">
                <div class="company-name">REECA TRAVEL</div>
                <div class="ticket-title">Bus Ticket</div>
            </div>
            
            <div class="booking-info">
                <div class="info-group">
                    <div class="info-label">Booking Reference:</div>
                    <div class="info-value">${bookingData.bookingRef}</div>
                    <div class="info-label">Passenger Name:</div>
                    <div class="info-value">${bookingData.userName}</div>
                    <div class="info-label">Email:</div>
                    <div class="info-value">${bookingData.userEmail}</div>
                </div>
                <div class="info-group">
                    <div class="info-label">Phone:</div>
                    <div class="info-value">${bookingData.userPhone}</div>
                    <div class="info-label">Total Amount:</div>
                    <div class="info-value">BWP ${bookingData.totalAmount}</div>
                    <div class="info-label">Payment Status:</div>
                    <div class="info-value">${bookingData.paymentStatus}</div>
                </div>
            </div>

            <div class="trip-section">
                <div class="trip-header">Departure Trip</div>
                <div class="trip-details">
                    <div>
                        <div class="info-label">Route:</div>
                        <div class="info-value">${bookingData.departureTrip.route}</div>
                    </div>
                    <div>
                        <div class="info-label">Date:</div>
                        <div class="info-value">${new Date(bookingData.departureTrip.date).toLocaleDateString()}</div>
                    </div>
                    <div>
                        <div class="info-label">Time:</div>
                        <div class="info-value">${bookingData.departureTrip.time}</div>
                    </div>
                    <div>
                        <div class="info-label">Bus Type:</div>
                        <div class="info-value">${bookingData.departureTrip.bus}</div>
                    </div>
                    <div>
                        <div class="info-label">Boarding Point:</div>
                        <div class="info-value">${bookingData.departureTrip.boardingPoint}</div>
                    </div>
                    <div>
                        <div class="info-label">Dropping Point:</div>
                        <div class="info-value">${bookingData.departureTrip.droppingPoint}</div>
                    </div>
                </div>
                
                <div class="passengers-section">
                    <div class="info-label">Passengers:</div>
                    <div class="passenger-list">
                        ${bookingData.departureTrip.passengers.map((passenger: any) => `
                            <div class="passenger-item">
                                <strong>${passenger.name}</strong><br>
                                Seat: ${passenger.seat}
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>

            ${bookingData.returnTrip ? `
                <div class="trip-section">
                    <div class="trip-header">Return Trip</div>
                    <div class="trip-details">
                        <div>
                            <div class="info-label">Route:</div>
                            <div class="info-value">${bookingData.returnTrip.route}</div>
                        </div>
                        <div>
                            <div class="info-label">Date:</div>
                            <div class="info-value">${new Date(bookingData.returnTrip.date).toLocaleDateString()}</div>
                        </div>
                        <div>
                            <div class="info-label">Time:</div>
                            <div class="info-value">${bookingData.returnTrip.time}</div>
                        </div>
                        <div>
                            <div class="info-label">Bus Type:</div>
                            <div class="info-value">${bookingData.returnTrip.bus}</div>
                        </div>
                        <div>
                            <div class="info-label">Boarding Point:</div>
                            <div class="info-value">${bookingData.returnTrip.boardingPoint}</div>
                        </div>
                        <div>
                            <div class="info-label">Dropping Point:</div>
                            <div class="info-value">${bookingData.returnTrip.droppingPoint}</div>
                        </div>
                    </div>
                    
                    <div class="passengers-section">
                        <div class="info-label">Passengers:</div>
                        <div class="passenger-list">
                            ${bookingData.returnTrip.passengers.map((passenger: any) => `
                                <div class="passenger-item">
                                    <strong>${passenger.name}</strong><br>
                                    Seat: ${passenger.seat}
                                </div>
                            `).join('')}
                        </div>
                    </div>
                </div>
            ` : ''}

            ${bookingData.addons && bookingData.addons.length > 0 ? `
                <div class="addons-section">
                    <div class="info-label">Additional Services:</div>
                    ${bookingData.addons.map((addon: any) => `
                        <div class="addon-item">
                            <strong>${addon.name}</strong>
                            ${addon.details ? `<br><small>${addon.details}</small>` : ''}
                            ${addon.price ? `<br><strong>BWP ${addon.price}</strong>` : ''}
                        </div>
                    `).join('')}
                </div>
            ` : ''}

            <div class="footer">
                <p>Thank you for choosing Reeca Travel!</p>
                <p>Please arrive at the boarding point at least 15 minutes before departure.</p>
                <p>For inquiries, contact us at tickets@reecatravel.co.bw</p>
            </div>
        </div>
    </body>
    </html>
  `;
}

export async function POST(req: Request) {
  try {
    const { bookingRef, contactIdNumber, email, addon, rescheduleDate } = await req.json();
    if (!bookingRef || !contactIdNumber || !email) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    // Find booking with matching bookingRef, main contact's id, and email
    const booking = await prisma.booking.findFirst({
      where: {
        orderId: bookingRef,
        userEmail: email,
        contactIdNumber: contactIdNumber,
      },
      include: { trip: true, passengers: true, returnTrip: true },
    });

    if (!booking) {
      return NextResponse.json({ error: "Booking not found or not authorized" }, { status: 403 });
    }

    // Check if departure is more than 24 hours away
    const departureDate = new Date(booking.trip.departureDate);
    const now = new Date();
    if (departureDate.getTime() - now.getTime() <= 24 * 60 * 60 * 1000) {
      return NextResponse.json({ error: "Cannot edit/reschedule within 24 hours of departure" }, { status: 403 });
    }

    // Handle reschedule
    if (rescheduleDate) {
      await prisma.booking.update({
        where: { id: booking.id },
        data: { trip: { update: { departureDate: rescheduleDate } } }
      });
    }

    // Handle addon (must pay for new addons)
    let updatedBooking = booking;
    if (addon) {
      // Calculate addon price (assume addon.price is sent from frontend)
      const addonPrice = addon.price || 0;

      // Create Stripe session for addon payment
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        line_items: [
          {
            price_data: {
              currency: "bwp",
              product_data: {
                name: addon.name,
                description: addon.details || "",
              },
              unit_amount: addonPrice * 100,
            },
            quantity: 1,
          },
        ],
        mode: "payment",
        success_url: `${process.env.NEXT_PUBLIC_APP_URL}/booking/manage?orderId=${bookingRef}&success=1`,
        cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/booking/manage?orderId=${bookingRef}&cancel=1`,
        customer_email: email,
        metadata: {
          orderId: bookingRef,
          addonName: addon.name,
        },
        expires_at: Math.floor(Date.now() / 1000) + (30 * 60),
      });

      // Update booking with new addon (as JSON array)
      updatedBooking = await prisma.booking.update({
        where: { id: booking.id },
        data: {
          addons: Array.isArray(booking.addons) ? [...booking.addons, addon] : [addon],
          transactionToken: session.id,
        },
        include: { trip: true, passengers: true, returnTrip: true },
      });

      // Return Stripe payment URL for frontend to redirect
      return NextResponse.json({
        paymentUrl: session.url,
        message: "Addon requires payment. Complete payment to receive updated ticket.",
      });
    }

    // After successful payment (or if no addon), send updated ticket
    // Map booking to BookingData shape for ticket generation
    const bookingData = {
      bookingRef: updatedBooking.orderId,
      userName: updatedBooking.userName,
      userEmail: updatedBooking.userEmail,
      userPhone: updatedBooking.userPhone,
      totalAmount: updatedBooking.totalPrice,
      paymentMethod: updatedBooking.paymentMode,
      paymentStatus: updatedBooking.paymentStatus,
      bookingStatus: updatedBooking.bookingStatus,
      departureTrip: {
        route: updatedBooking.trip.routeName,
        date: updatedBooking.trip.departureDate,
        time: updatedBooking.trip.departureTime,
        bus: updatedBooking.trip.serviceType,
        boardingPoint: updatedBooking.boardingPoint || "Not specified",
        droppingPoint: updatedBooking.droppingPoint || "Not specified",
        seats: JSON.parse(updatedBooking.seats),
        passengers: updatedBooking.passengers
          .filter(p => !p.isReturn)
          .map(p => ({
            name: `${p.firstName} ${p.lastName}`,
            seat: p.seatNumber,
            title: p.title,
            isReturn: p.isReturn,
          })),
      },
      returnTrip: updatedBooking.returnTrip
        ? {
            route: updatedBooking.returnTrip.routeName,
            date: updatedBooking.returnTrip.departureDate,
            time: updatedBooking.returnTrip.departureTime,
            bus: updatedBooking.returnTrip.serviceType,
            boardingPoint: updatedBooking.returnBoardingPoint || "Not specified",
            droppingPoint: updatedBooking.returnDroppingPoint || "Not specified",
            seats: updatedBooking.returnSeats ? JSON.parse(updatedBooking.returnSeats) : [],
            passengers: updatedBooking.passengers
              .filter(p => p.isReturn)
              .map(p => ({
                name: `${p.firstName} ${p.lastName}`,
                seat: p.seatNumber,
                title: p.title,
                isReturn: p.isReturn,
              })),
          }
        : undefined,
      addons: Array.isArray(updatedBooking.addons)
        ? updatedBooking.addons
            .filter(
              (a): a is { name: string; details?: string; price?: string } =>
                !!a && typeof a === "object" && !Array.isArray(a) && typeof (a as any).name === "string"
            )
        : [],
    };

    // Generate HTML for the ticket
    const html = generateTicketHTML(bookingData);

    // Generate PDF from HTML using html-pdf
    const pdfBuffer: Buffer = await new Promise((resolve, reject) => {
      pdf.create(html, { format: "A4" }).toBuffer((err: Error, buffer: Buffer) => {
        if (err) reject(err);
        else resolve(buffer);
      });
    });

    // Setup Gmail SMTP transporter
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
      },
    });

    // Send email with PDF attachment
    await transporter.sendMail({
      from: `"Reeca Travel" <${process.env.GMAIL_USER}>`,
      to: email,
      subject: "Your Updated Reeca Travel Ticket",
      text: `Dear ${updatedBooking.userName},\n\nAttached is your updated bus ticket.\nBooking Ref: ${updatedBooking.orderId}`,
      attachments: [
        {
          filename: `ReecaTicket-${updatedBooking.orderId}.pdf`,
          content: pdfBuffer,
        },
      ],
    });

    return NextResponse.json({ success: true, message: "Updated ticket sent to email." });
  } catch (err: any) {
    console.error("[booking/addons] Error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}