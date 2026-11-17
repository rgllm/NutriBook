require "test_helper"

class AppointmentRequestMailerTest < ActionMailer::TestCase
  test "accepted gives the guest the appointment in Lisbon time" do
    # 1 December is winter time, so Lisbon matches UTC; 14:00 UTC is 14:00.
    email = AppointmentRequestMailer.answer(appointment_requests(:accepted))

    assert_equal [ "francisco.neves@example.com" ], email.to
    assert_equal "Your appointment with Mary Jane is confirmed", email.subject
    each_body(email) do |body|
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
    each_body(email) do |body|
      assert_includes body, "Ana Ferreira can't take this appointment request."
      assert_includes body, "You can request another time on NutriBook."
    end
  end

  test "a request rejected for an overlap says the time was taken" do
    request = appointment_requests(:rejected)
    request.rejection_reason = "overlap"

    body = AppointmentRequestMailer.answer(request).text_part.decoded

    assert_includes body, "accepted another appointment at the same time, so this time is no longer available."
  end

  test "a request booked in Portuguese is confirmed in Portuguese" do
    request = appointment_requests(:accepted)
    request.language = "pt-PT"

    email = AppointmentRequestMailer.answer(request)

    assert_equal "A sua consulta com Mary Jane está confirmada", email.subject
    assert_includes email.html_part.decoded, '<html lang="pt-PT">'
    each_body(email) do |body|
      assert_includes body, "Olá Francisco Neves,"
      assert_includes body, "Mary Jane aceitou o seu pedido de consulta."
      assert_includes body, "terça-feira, 1 de dezembro de 2026, das 14:00 às 14:30 (hora de Lisboa)"
      assert_includes body, "Rua do Souto 45, Braga"
      assert_not_includes body, "Lisbon time"
    end
  end

  test "a request booked in Portuguese is declined in Portuguese" do
    request = appointment_requests(:rejected)
    request.language = "pt-PT"

    email = AppointmentRequestMailer.answer(request)

    assert_equal "O seu pedido de consulta com Ana Ferreira não foi aceite", email.subject
    each_body(email) do |body|
      assert_includes body, "Ana Ferreira não pode aceitar este pedido de consulta."
      assert_includes body, "Pode pedir outra hora no NutriBook."
    end
  end

  test "a request in a language NutriBook does not write is answered in English" do
    request = appointment_requests(:accepted)
    request.language = "fr-FR"

    assert_equal "Your appointment with Mary Jane is confirmed", AppointmentRequestMailer.answer(request).subject
  end

  test "every email language has the same messages" do
    keys = AppointmentRequest::LANGUAGES.map do |language|
      translations = YAML.load_file(Rails.root.join("config/locales/#{language}.yml")).fetch(language)
      key_paths(translations)
    end

    assert_equal 1, keys.uniq.size, "config/locales/{#{AppointmentRequest::LANGUAGES.join(",")}}.yml differ"
  end

  test "a request that is not answered has no email" do
    assert_raises(ArgumentError) { AppointmentRequestMailer.answer(appointment_requests(:pending)) }
    assert_raises(ArgumentError) { AppointmentRequestMailer.answer(appointment_requests(:superseded)) }
  end

  private

  # Each part as the guest reads it: the text part as sent, the HTML part
  # without its markup or entities.
  def each_body(email)
    yield email.text_part.decoded
    yield Nokogiri::HTML(email.html_part.decoded).text.squish
  end

  def key_paths(hash, prefix = nil)
    hash.flat_map do |key, value|
      path = [ prefix, key ].compact.join(".")
      value.is_a?(Hash) ? key_paths(value, path) : [ path ]
    end.sort
  end
end
