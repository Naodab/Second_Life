import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import { useForm, type UseFormReturn } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, Plus, User } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAuth } from "@/context/AuthContext";
import { getCurrentProfile } from "@/api/profile";
import {
  createCustomer,
  listCustomers,
  savedCustomerToOrderInfo,
  updateCustomer,
  type SavedCustomer,
} from "@/api/customer";
import { toast } from "@/hooks/use-toast";
import { ApiError } from "@workspace/api-client-react";
import { cn } from "@/lib/utils";
import { checkoutSectionClass } from "./checkout-utils";
import { CustomerLocationPickers } from "./CustomerLocationPickers";

const CHECKOUT_ORDER_INFO_KEY = "checkoutOrderInfo";
const CHECKOUT_SELECTED_CUSTOMER_KEY = "checkoutSelectedCustomerId";

const phoneSchema = z
  .string()
  .trim()
  .min(1, "Bắt buộc")
  .refine((s) => /^(\+84|0)\d{9}$/.test(s), {
    message: "Số điện thoại Việt Nam: +84 hoặc 0 và 9 chữ số",
  });

export const checkoutOrderInfoSchema = z.object({
  firstName: z.string().trim().min(1, "Bắt buộc"),
  lastName: z.string().trim().min(1, "Bắt buộc"),
  phoneNumber: phoneSchema,
  email: z.string().trim().min(1, "Bắt buộc").email("Email không hợp lệ"),
  address: z
    .string()
    .trim()
    .min(3, "Địa chỉ: tối thiểu 3 ký tự")
    .max(255, "Địa chỉ: tối đa 255 ký tự"),
  provinceCode: z.string().trim().min(1, "Chọn tỉnh/thành"),
  wardCode: z.string().trim().min(1, "Chọn phường/xã"),
});

export type CheckoutOrderInfo = z.infer<typeof checkoutOrderInfoSchema>;

export type CheckoutOrderSelection = {
  customerId: string;
  orderInfo: CheckoutOrderInfo;
};

export type CheckoutOrderInfoFormRef = {
  validate: () => Promise<CheckoutOrderSelection | null>;
  getSelectedCustomerId: () => string | null;
};

const inputClassName = "h-11 rounded-xl bg-background/80";
const emptyOrderInfo: CheckoutOrderInfo = {
  firstName: "",
  lastName: "",
  phoneNumber: "",
  email: "",
  address: "",
  provinceCode: "",
  wardCode: "",
};

function readStoredOrderInfo(): CheckoutOrderInfo | null {
  try {
    const raw = sessionStorage.getItem(CHECKOUT_ORDER_INFO_KEY);
    if (!raw) return null;
    const parsed = checkoutOrderInfoSchema.safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

function storeOrderInfo(info: CheckoutOrderInfo) {
  sessionStorage.setItem(CHECKOUT_ORDER_INFO_KEY, JSON.stringify(info));
}

function customerDisplayName(c: Pick<SavedCustomer, "firstName" | "lastName">) {
  return [c.lastName, c.firstName].filter(Boolean).join(" ").trim() || "Khách hàng";
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="text-xs text-destructive mt-1">{message}</p>;
}

function OrderInfoFields({
  form,
  idPrefix,
  disabled,
  provinceLabel,
  wardLabel,
  showLocationPickers,
}: {
  form: UseFormReturn<CheckoutOrderInfo>;
  idPrefix: string;
  disabled?: boolean;
  provinceLabel?: string;
  wardLabel?: string;
  showLocationPickers?: boolean;
}) {
  const { errors } = form.formState;
  const provinceCode = form.watch("provinceCode");
  const wardCode = form.watch("wardCode");

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor={`${idPrefix}-lastName`} className="text-sm font-medium mb-1.5 block text-foreground">
            Họ <span className="text-destructive">*</span>
          </label>
          <Input
            id={`${idPrefix}-lastName`}
            autoComplete="family-name"
            disabled={disabled}
            className={inputClassName}
            {...form.register("lastName")}
          />
          <FieldError message={errors.lastName?.message} />
        </div>
        <div>
          <label htmlFor={`${idPrefix}-firstName`} className="text-sm font-medium mb-1.5 block text-foreground">
            Tên <span className="text-destructive">*</span>
          </label>
          <Input
            id={`${idPrefix}-firstName`}
            autoComplete="given-name"
            disabled={disabled}
            className={inputClassName}
            {...form.register("firstName")}
          />
          <FieldError message={errors.firstName?.message} />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor={`${idPrefix}-phone`} className="text-sm font-medium mb-1.5 block text-foreground">
            Số điện thoại <span className="text-destructive">*</span>
          </label>
          <Input
            id={`${idPrefix}-phone`}
            type="tel"
            autoComplete="tel"
            disabled={disabled}
            placeholder={disabled ? undefined : "+84901234567 hoặc 0901234567"}
            className={inputClassName}
            {...form.register("phoneNumber")}
          />
          <FieldError message={errors.phoneNumber?.message} />
        </div>
        <div>
          <label htmlFor={`${idPrefix}-email`} className="text-sm font-medium mb-1.5 block text-foreground">
            Email <span className="text-destructive">*</span>
          </label>
          <Input
            id={`${idPrefix}-email`}
            type="email"
            autoComplete="email"
            disabled={disabled}
            className={inputClassName}
            {...form.register("email")}
          />
          <FieldError message={errors.email?.message} />
        </div>
      </div>

      <div>
        <label htmlFor={`${idPrefix}-address`} className="text-sm font-medium mb-1.5 block text-foreground">
          Địa chỉ <span className="text-destructive">*</span>
        </label>
        <Textarea
          id={`${idPrefix}-address`}
          autoComplete="street-address"
          disabled={disabled}
          placeholder={disabled ? undefined : "Số nhà, đường, phường/xã, quận/huyện, tỉnh/thành phố"}
          rows={3}
          className="rounded-xl bg-background/80 resize-y min-h-[88px]"
          {...form.register("address")}
        />
        <FieldError message={errors.address?.message} />
      </div>

      {showLocationPickers ? (
        <>
          <CustomerLocationPickers
            key={`${idPrefix}-loc-${provinceCode ?? ""}-${wardCode ?? ""}`}
            idPrefix={`${idPrefix}-loc`}
            provinceCode={provinceCode ?? ""}
            wardCode={wardCode ?? ""}
            provinceLabel={provinceLabel}
            wardLabel={wardLabel}
            disabled={disabled}
            onProvinceChange={(code) => {
              form.setValue("provinceCode", code, { shouldDirty: true, shouldValidate: true });
              form.setValue("wardCode", "", { shouldDirty: true, shouldValidate: true });
            }}
            onWardChange={(code) => form.setValue("wardCode", code, { shouldDirty: true, shouldValidate: true })}
          />
          <FieldError message={errors.provinceCode?.message} />
          <FieldError message={errors.wardCode?.message} />
        </>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium mb-1.5 block text-foreground">Tỉnh / Thành phố</label>
            <Input disabled className={inputClassName} value={provinceLabel ?? ""} readOnly />
          </div>
          <div>
            <label className="text-sm font-medium mb-1.5 block text-foreground">Phường / Xã</label>
            <Input disabled className={inputClassName} value={wardLabel ?? ""} readOnly />
          </div>
        </div>
      )}
    </div>
  );
}

export const CheckoutOrderInfoForm = forwardRef<CheckoutOrderInfoFormRef>(function CheckoutOrderInfoForm(
  _props,
  ref,
) {
  const { user, isLoggedIn } = useAuth();
  const queryClient = useQueryClient();
  const [pickerOpen, setPickerOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editMode, setEditMode] = useState<"create" | "edit">("create");
  const [editingCustomerId, setEditingCustomerId] = useState<string | null>(null);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [setAsDefault, setSetAsDefault] = useState(false);
  const didInitGuestRef = useRef(false);
  const syncedCustomerKeyRef = useRef<string | null>(null);

  const profileQuery = useQuery({
    queryKey: ["checkoutProfileMe"] as const,
    queryFn: getCurrentProfile,
    enabled: isLoggedIn,
    staleTime: 60_000,
  });

  const customersQuery = useQuery({
    queryKey: ["checkoutCustomers"] as const,
    queryFn: listCustomers,
    enabled: isLoggedIn,
    staleTime: 30_000,
  });

  const form = useForm<CheckoutOrderInfo>({
    resolver: zodResolver(checkoutOrderInfoSchema),
    defaultValues: emptyOrderInfo,
    mode: "onTouched",
  });

  const editForm = useForm<CheckoutOrderInfo>({
    resolver: zodResolver(checkoutOrderInfoSchema),
    defaultValues: emptyOrderInfo,
    mode: "onTouched",
  });

  function customerSyncKey(c: SavedCustomer) {
    return `${c.id}|${c.provinceCode}|${c.wardCode}|${c.address}|${c.phoneNumber}`;
  }

  const applyCustomer = (customer: SavedCustomer) => {
    setSelectedCustomerId(customer.id);
    sessionStorage.setItem(CHECKOUT_SELECTED_CUSTOMER_KEY, customer.id);
    const info = { ...emptyOrderInfo, ...savedCustomerToOrderInfo(customer) };
    syncedCustomerKeyRef.current = customerSyncKey(customer);
    form.reset(info);
    storeOrderInfo(info);
  };

  const customers = customersQuery.data ?? [];
  const selectedCustomer = customers.find((c) => c.id === selectedCustomerId) ?? null;

  useEffect(() => {
    if (!isLoggedIn) {
      syncedCustomerKeyRef.current = null;
      if (didInitGuestRef.current) return;
      const stored = readStoredOrderInfo();
      if (stored) form.reset({ ...emptyOrderInfo, ...stored });
      else {
        form.reset({
          ...emptyOrderInfo,
          firstName: user?.firstName?.trim() ?? "",
          lastName: user?.lastName?.trim() ?? "",
          phoneNumber: "",
          email: user?.email?.trim() ?? "",
        });
      }
      didInitGuestRef.current = true;
      return;
    }

    didInitGuestRef.current = false;
    if (customersQuery.isLoading) return;

    if (customers.length === 0) {
      setSelectedCustomerId(null);
      syncedCustomerKeyRef.current = null;
      return;
    }

    const storedId = sessionStorage.getItem(CHECKOUT_SELECTED_CUSTOMER_KEY);
    const initial =
      customers.find((c) => c.id === selectedCustomerId) ??
      customers.find((c) => c.id === storedId) ??
      customers.find((c) => c.isDefault) ??
      customers[0];

    if (!initial) return;
    if (selectedCustomerId !== initial.id) {
      applyCustomer(initial);
    }
  }, [isLoggedIn, customersQuery.isLoading, customers, form, user, selectedCustomerId]);

  useEffect(() => {
    if (!isLoggedIn || customersQuery.isLoading || !selectedCustomer) return;
    const key = customerSyncKey(selectedCustomer);
    if (syncedCustomerKeyRef.current === key) return;
    syncedCustomerKeyRef.current = key;
    const info = { ...emptyOrderInfo, ...savedCustomerToOrderInfo(selectedCustomer) };
    form.reset(info);
    storeOrderInfo(info);
  }, [isLoggedIn, customersQuery.isLoading, selectedCustomer, form]);

  useEffect(() => {
    if (!editOpen) return;
    if (editMode === "edit" && selectedCustomer) {
      editForm.reset({ ...emptyOrderInfo, ...savedCustomerToOrderInfo(selectedCustomer) });
      setSetAsDefault(selectedCustomer.isDefault);
    } else {
      const phone = profileQuery.data?.phoneNumber?.trim() ?? "";
      editForm.reset({
        ...emptyOrderInfo,
        firstName: user?.firstName?.trim() ?? "",
        lastName: user?.lastName?.trim() ?? "",
        phoneNumber: phone,
        email: user?.email?.trim() ?? "",
      });
      setSetAsDefault(customers.length === 0);
    }
    editForm.clearErrors();
  }, [editOpen, editMode, selectedCustomer, editForm, profileQuery.data, user, customers.length]);

  const saveMutation = useMutation({
    mutationFn: async (values: CheckoutOrderInfo) => {
      const body = { customer: values, setAsDefault };
      if (editMode === "edit" && editingCustomerId) {
        return updateCustomer(editingCustomerId, body);
      }
      return createCustomer(body);
    },
    onSuccess: (saved) => {
      void queryClient.invalidateQueries({ queryKey: ["checkoutCustomers"] });
      applyCustomer(saved);
      setEditOpen(false);
      setPickerOpen(false);
      toast({
        title: editMode === "edit" ? "Đã cập nhật thông tin" : "Đã thêm thông tin đặt hàng",
      });
    },
    onError: (e) => {
      const msg = e instanceof ApiError ? e.message : e instanceof Error ? e.message : "Không thể lưu thông tin.";
      toast({ title: "Lưu thất bại", description: msg, variant: "destructive" });
    },
  });

  const openCreate = () => {
    setEditMode("create");
    setEditingCustomerId(null);
    setEditOpen(true);
  };

  const openEditSelected = () => {
    if (!selectedCustomer) return;
    setEditMode("edit");
    setEditingCustomerId(selectedCustomer.id);
    setEditOpen(true);
  };

  const handleEditSave = editForm.handleSubmit((values) => {
    saveMutation.mutate(values);
  });

  useImperativeHandle(ref, () => ({
    getSelectedCustomerId: () => selectedCustomerId,
    validate: () =>
      new Promise((resolve) => {
        if (!isLoggedIn || !selectedCustomerId) {
          resolve(null);
          return;
        }
        void form.handleSubmit(
          (orderInfo) => resolve({ customerId: selectedCustomerId, orderInfo }),
          () => resolve(null),
        )();
      }),
  }));

  const showEmptyHint = isLoggedIn && !customersQuery.isLoading && customers.length === 0;

  return (
    <>
      <div className={checkoutSectionClass}>
        <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
          <div className="flex items-center gap-2 min-w-0">
            <User className="w-5 h-5 text-primary flex-shrink-0" />
            <h3 className="font-bold text-lg text-foreground">Thông tin đặt hàng</h3>
          </div>
          {isLoggedIn && (
            <div className="flex items-center gap-2 flex-shrink-0 flex-wrap justify-end">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="rounded-full"
                onClick={() => setPickerOpen(true)}
              >
                Thay đổi thông tin đặt hàng
              </Button>
              <Button type="button" variant="outline" size="sm" className="rounded-full" onClick={openCreate}>
                <Plus className="w-4 h-4 mr-1" />
                Thêm thông tin đặt hàng
              </Button>
              {selectedCustomer && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="rounded-full text-muted-foreground"
                  onClick={openEditSelected}
                >
                  Chỉnh sửa
                </Button>
              )}
            </div>
          )}
        </div>

        {showEmptyHint && (
          <p className="text-sm text-muted-foreground mb-4">
            Bạn chưa có thông tin đặt hàng đã lưu.{" "}
            <button type="button" className="text-primary font-medium hover:underline" onClick={openCreate}>
              Thêm thông tin đặt hàng
            </button>
          </p>
        )}

        <form className="space-y-4" onSubmit={(e) => e.preventDefault()} noValidate>
          <OrderInfoFields
            form={form}
            idPrefix="checkout"
            disabled={isLoggedIn}
            showLocationPickers={!isLoggedIn}
            provinceLabel={
              selectedCustomer?.provinceName?.trim() || selectedCustomer?.provinceCode || undefined
            }
            wardLabel={selectedCustomer?.wardName?.trim() || selectedCustomer?.wardCode || undefined}
          />
          {!isLoggedIn && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="rounded-full"
              onClick={() => {
                editForm.reset(form.getValues());
                setEditOpen(true);
              }}
            >
              Cập nhật thông tin
            </Button>
          )}
        </form>
      </div>

      {/* Picker — chọn địa chỉ đã lưu */}
      <Dialog open={pickerOpen} onOpenChange={setPickerOpen}>
        <DialogContent className="sm:max-w-md rounded-3xl max-h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Thay đổi thông tin đặt hàng</DialogTitle>
            <DialogDescription>Chọn thông tin đã lưu hoặc thêm mới bên dưới.</DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto space-y-2 min-h-0 py-1">
            {customersQuery.isLoading && (
              <p className="text-sm text-muted-foreground text-center py-6">Đang tải…</p>
            )}
            {customers.map((c) => {
              const selected = c.id === selectedCustomerId;
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => {
                    applyCustomer(c);
                    setPickerOpen(false);
                  }}
                  className={cn(
                    "w-full text-left rounded-2xl border p-4 transition-colors",
                    selected
                      ? "border-primary bg-primary/5 ring-1 ring-primary/30"
                      : "border-border hover:bg-muted/50",
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-sm text-foreground">{customerDisplayName(c)}</span>
                        {c.isDefault && (
                          <Badge variant="secondary" className="text-[10px] px-2 py-0">
                            Mặc định
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">{c.phoneNumber}</p>
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                        {[c.wardName, c.provinceName].filter(Boolean).join(", ")}
                        {c.wardName || c.provinceName ? " · " : ""}
                        {c.address}
                      </p>
                    </div>
                    {selected && <Check className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />}
                  </div>
                </button>
              );
            })}
          </div>

          <DialogFooter className="flex-col sm:flex-col gap-2 pt-2">
            <Button type="button" className="w-full rounded-full" onClick={openCreate}>
              <Plus className="w-4 h-4 mr-2" />
              Thêm thông tin đặt hàng
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Tạo / chỉnh sửa */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-lg rounded-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editMode === "edit" ? "Chỉnh sửa thông tin đặt hàng" : "Thêm thông tin đặt hàng"}
            </DialogTitle>
            <DialogDescription>
              {isLoggedIn
                ? "Lưu vào danh sách để dùng cho các đơn sau."
                : "Thông tin chỉ dùng cho phiên thanh toán này."}
            </DialogDescription>
          </DialogHeader>

          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              if (isLoggedIn) {
                void handleEditSave();
              } else {
                void editForm.handleSubmit((values) => {
                  storeOrderInfo(values);
                  form.reset(values);
                  setEditOpen(false);
                  toast({ title: "Đã cập nhật thông tin đặt hàng" });
                })();
              }
            }}
            noValidate
          >
            <OrderInfoFields
              form={editForm}
              idPrefix="checkout-edit"
              showLocationPickers
              provinceLabel={
                editMode === "edit" && selectedCustomer
                  ? selectedCustomer.provinceName?.trim() || selectedCustomer.provinceCode
                  : undefined
              }
              wardLabel={
                editMode === "edit" && selectedCustomer
                  ? selectedCustomer.wardName?.trim() || selectedCustomer.wardCode
                  : undefined
              }
            />
            {isLoggedIn && (
              <label className="flex items-center gap-2 cursor-pointer">
                <Checkbox checked={setAsDefault} onCheckedChange={(v) => setSetAsDefault(v === true)} />
                <span className="text-sm text-foreground">Đặt làm mặc định</span>
              </label>
            )}
            <DialogFooter className="gap-2 sm:gap-0 pt-2">
              <Button type="button" variant="outline" className="rounded-full" onClick={() => setEditOpen(false)}>
                Hủy
              </Button>
              <Button type="submit" className="rounded-full" disabled={saveMutation.isPending}>
                {saveMutation.isPending ? "Đang lưu…" : "Lưu"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
});
