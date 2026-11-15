require "test_helper"

class AppointmentRequestMailerTest < ActionMailer::TestCase
  test "accepted gives the guest the appointment in Lisbon time" do
    # 1 December is winter time, so Lisbon matches UTC; 14:00 UTC is 14:00.
    email = AppointmentRequestMailer.answer(appointment_requests(:accepted))

    assert_equal [ "francisco.neves@example.com" ], email.to
    assert_equal "Your appointment with Mary Jane is confirmed", email.subject
    [ email.text_part, email.html_part ].each do |part|
      body = part.decoded
      assert_includes body, "Hi Francisco Neves,"
      assert_includes body, "Mary Jane accepted your appointment request."
      assert_includes body, "Follow-up"
      assert_includes body, "Tuesday, 1 December 2026, 14:00 to 14:30 (Lisbon time)"
      assert_includes body, "Rua do Souto 45, Braga"
    end
  end

  test "times follow Lisbon summer time" do
    request = appointment_requests(:accepted)
    request.assign_attributes(starts_at: Time.utc(2027, 6, 7, 9, 0), ends_at: Time.utc(2027, 6, 7, 9, 30))

    body = AppointmentRequestMailer.answer(request).text_part.decoded

    assert_includes body, "Monday, 7 June 2027, 10:00 to 10:30 (Lisbon time)"
  end

  test "an online appointment has no address" do
    request = appointment_requests(:accepted)
    request.online = true

    body = AppointmentRequestMailer.answer(request).text_part.decoded

    assert_includes body, "Where: Online"
    assert_not_includes body, "Rua do Souto"
  end

  test "a declined request says the nutritionist can't take it" do
    email = AppointmentRequestMailer.answer(appointment_requests(:rejected))

    assert_equal [ "tiago.lopes@example.com" ], email.to
    assert_equal "Your appointment request with Ana Ferreira was not accepted", email.subject
    [ email.text_part, email.html_part ].each do |part|
      assert_includes part.decoded, "Ana Ferreira can't take this appointment request."
    end
  end

  test "a request rejected for an overlap says the time was taken" do
    request = appointment_requests(:rejected)
    request.rejection_reason = "overlap"

    body = AppointmentRequestMailer.answer(request).text_part.decoded

    assert_includes body, "accepted another appointment at the same time, so this time is no longer available."
  end

  test "a request that is not answered has no email" do
    assert_raises(ArgumentError) { AppointmentRequestMailer.answer(appointment_requests(:pending)) }
    assert_raises(ArgumentError) { AppointmentRequestMailer.answer(appointment_requests(:superseded)) }
  end
end
