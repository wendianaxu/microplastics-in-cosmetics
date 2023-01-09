library(rvest)
library(tidyverse)
library(dplyr)
library(stringr)
library(readr)

setwd("/Users/wenx/Documents/Code/data-viz-projects/mp")

# transform #
data <- read_csv("MPdataFinalized2.csv")

# replace n/a with "none" for ingredient
data$ingredients[is.na(data$ingredients)] <- "none"

# create unique id for each product & ingredient
id_data <- data %>%
  group_by(product) %>%
  mutate(p_id = cur_group_id()) %>%
  ungroup() %>%
  group_by(ingredients) %>%
  mutate(i_id = cur_group_id()) %>%
  ungroup() 

# create column for # of ingredient by product
data_counted <- id_data %>%
  group_by(product) %>%
  mutate(n_ingre = length(unique(ingredients))) %>%
  mutate(n_ingre = ifelse(ingredients == "none", 0, n_ingre)) %>%
  ungroup() 

# create column for # & % of products w/ MP by product type
data_full <- data_counted %>%
  group_by(product_type) %>%
  mutate(n_product = length(unique(product))) %>%
  mutate(mp_count = length(unique(product[n_ingre == 0])), 
         mp_percent = mp_count/n_product) %>%
  mutate(MP_present = ifelse(n_ingre == 0, 0, 1))
  

# summary table for # & % of products w/ MP by product type
mp_products <- id_data %>%
  group_by(product_type) %>%
  mutate(n_product = length(unique(product))) %>%
  filter(ingredient != 'none') %>%
  mutate(mp_count = length(unique(product)), 
         mp_percent = mp_count/n_product) %>%
  select(product_type, mp_count, mp_percent) %>%
  distinct()

# number of products containing each MP ingredient by product type
ingre_by_type <- data_full %>% 
  group_by(ingredients) %>%
  mutate(n_product_with_ingre = length(unique(product))) %>%
  mutate(percent_with_ingre = n_product_with_ingre/n_product)

write.csv(id_data, "id_data.csv", row.names = FALSE)
write.csv(mp_products, "mp_products_1016.csv", row.names = FALSE)

write.csv(data_full, "MPdataFinalized3.csv", row.names = FALSE)
