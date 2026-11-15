class ApplicationMailer < ActionMailer::Base
  default from: ENV.fetch("MAIL_FROM", "NutriBook <no-reply@nutribook.example>")
  layout "mailer"
end
