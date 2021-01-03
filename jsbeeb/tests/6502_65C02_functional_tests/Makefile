.PHONY: all assembler

EXE_DIR := bin
ASSEMBLER := $(EXE_DIR)/as65
BIN_FILES := bin_files/6502_functional_test.bin bin_files/65C02_extended_opcodes_test.bin bin_files/65C12_extended_opcodes_test.bin
AS_FLAGS := -z -m -w -h0

all: $(BIN_FILES)

assembler: $(ASSEMBLER)

$(ASSEMBLER):
	mkdir -p $(EXE_DIR)
	curl http://www.kingswood-consulting.co.uk/assemblers/as65_142.zip -o $(EXE_DIR)/as65.zip
	cd $(EXE_DIR) && unzip as65.zip

define ADD_FILE
bin_files/$(1).bin bin_files/$(1).lst: $(2) | assembler
	mkdir -p $$(dir $$@)
	$(ASSEMBLER) $(AS_FLAGS) $(3) -obin_files/$(1).bin.1 -lbin_files/$(1).lst $$<
	(dd if=/dev/zero count=10 bs=1; cat bin_files/$(1).bin.1) > bin_files/$(1).bin
	rm bin_files/$(1).bin.1
endef

$(eval $(call ADD_FILE,6502_functional_test,6502_functional_test.a65,))
$(eval $(call ADD_FILE,65C02_extended_opcodes_test,65C02_extended_opcodes_test.a65c,-x))
$(eval $(call ADD_FILE,65C12_extended_opcodes_test,65C02_extended_opcodes_test.a65c,-x -dcpu65c12))

#bin_files/6502_functional_test.bin bin_files/6502_functional_test.lst: 6502_functional_test.a65 | assembler
#	mkdir -p $(dir $@)
#	$(ASSEMBLER) $(AS_FLAGS) -obin_files/6502_functional_test.bin.1 -lbin_files/6502_functional_test.lst $<
#	(dd if=/dev/zero count=10 bs=1; cat bin_files/6502_functional_test.bin.1) > bin_files/6502_functional_test.bin
#	rm bin_files/6502_functional_test.bin.1
#
#bin_files/65C02_extended_opcodes_test.bin bin_files/65C02_extended_opcodes_test.lst: 65C02_extended_opcodes_test.a65c | assembler
#	mkdir -p $(dir $@)
#	$(ASSEMBLER) $(AS_FLAGS) -x -obin_files/65C02_extended_opcodes_test.bin.1 -lbin_files/65C02_extended_opcodes_test.lst $<
#
#bin_files/65C12_extended_opcodes_test.bin bin_files/65C12_extended_opcodes_test.lst: 65C02_extended_opcodes_test.a65c | assembler
#	mkdir -p $(dir $@)
#	$(ASSEMBLER) $(AS_FLAGS) -x -obin_files/65C12_extended_opcodes_test.bin.1 -lbin_files/65C12_extended_opcodes_test.lst -dcpu65c12 $<

clean:
	rm -rf bin_files
