# Use an official Ubuntu as a parent image
FROM ubuntu:20.04

# Install dependencies
RUN apt-get update && \
    apt-get install -y curl gnupg2 apt-transport-https lsb-release

# Add the LavinMQ repository key
RUN curl -L https://packagecloud.io/cloudamqp/lavinmq/gpgkey | apt-key add -

# Add the LavinMQ repository
RUN echo "deb https://packagecloud.io/cloudamqp/lavinmq/ubuntu/ $(lsb_release -cs) main" | tee /etc/apt/sources.list.d/lavinmq.list

# Update package lists and install LavinMQ
RUN apt-get update && \
    apt-get install -y lavinmq

# Expose necessary ports
EXPOSE 15672
EXPOSE 5672
EXPOSE 443

# Copy the entrypoint and setup scripts into the image
COPY entrypoint.sh /usr/local/bin/entrypoint.sh
RUN chmod +x /usr/local/bin/entrypoint.sh

# Use the entrypoint script as the CMD
CMD ["/usr/local/bin/entrypoint.sh"]

