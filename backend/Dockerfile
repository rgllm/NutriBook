FROM ruby:3.4.12-slim

RUN apt-get update -qq && \
    apt-get install --no-install-recommends -y build-essential git libpq-dev && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /rails

COPY Gemfile Gemfile.lock ./
RUN bundle install

COPY . .

ENTRYPOINT ["/rails/bin/docker-entrypoint"]
EXPOSE 3000
CMD ["bin/rails", "server", "-b", "0.0.0.0"]
